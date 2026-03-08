"""Load models and run inference on uploaded sensor data."""

import numpy as np
import torch
import joblib
from pathlib import Path
from scipy.signal import decimate
from scipy.special import softmax

from .models import WaveNet, InceptionTime
from .damage_info import DAMAGE_INFO, T_DESIGN, K_DEGRADE

DOWNSAMPLE_FACTOR = 8
WINDOW_SIZE = 4096
STRIDE = 2048
NUM_CLASSES = 17


class BridgeHealthAnalyzer:
    """Loads all trained models and runs damage classification + RUL estimation."""

    def __init__(self, models_dir: str):
        self.models_dir = Path(models_dir)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.wavenet = None
        self.inception = None
        self.minirocket = None
        self._load_models()

    def _load_models(self):
        """Load all three trained models."""
        wn_path = self.models_dir / "wavenet_v4.pth"
        if wn_path.exists():
            checkpoint = torch.load(wn_path, map_location=self.device, weights_only=False)
            self.wavenet = WaveNet(num_classes=17, filters=48, num_stacks=2,
                                    layers_per_stack=8, dropout=0.5).to(self.device)
            self.wavenet.load_state_dict(checkpoint['model_state_dict'])
            self.wavenet.eval()
            print(f"  WaveNet loaded (test acc: {checkpoint.get('test_acc', 'N/A')})")

        it_path = self.models_dir / "inceptiontime_v1.pth"
        if it_path.exists():
            checkpoint = torch.load(it_path, map_location=self.device, weights_only=False)
            self.inception = InceptionTime(in_channels=1, num_classes=17,
                                            n_filters=32, n_blocks=2, dropout=0.4).to(self.device)
            self.inception.load_state_dict(checkpoint['model_state_dict'])
            self.inception.eval()
            print(f"  InceptionTime loaded (test acc: {checkpoint.get('test_acc', 'N/A')})")

        mr_path = self.models_dir / "minirocket_v1.pkl"
        if mr_path.exists():
            self.minirocket = joblib.load(mr_path)
            print(f"  MiniRocket loaded (test acc: {self.minirocket.get('test_acc', 'N/A')})")

    def preprocess(self, signal: np.ndarray) -> dict:
        """Preprocess a raw signal for all models."""
        signal = signal.astype(np.float32)
        
        # Handle NaN/Inf
        signal = np.nan_to_num(signal, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Normalize
        std = signal.std()
        if std < 1e-8:
            std = 1.0
        signal = (signal - signal.mean()) / std

        # Downsample
        ds_signal = np.array(decimate(signal, DOWNSAMPLE_FACTOR), dtype=np.float32)

        # Segment into windows
        windows = []
        start = 0
        while start + WINDOW_SIZE <= len(ds_signal):
            windows.append(ds_signal[start:start + WINDOW_SIZE])
            start += STRIDE

        if len(windows) == 0:
            padded = np.zeros(WINDOW_SIZE, dtype=np.float32)
            padded[:min(len(ds_signal), WINDOW_SIZE)] = ds_signal[:WINDOW_SIZE]
            windows = [padded]

        windows = np.array(windows, dtype=np.float32)

        return {
            'windows': windows,
            'ds_signal': ds_signal,
            'original_length': len(signal),
        }

    def _safe_softmax(self, logits):
        """Softmax that always returns valid probabilities."""
        logits = np.nan_to_num(logits, nan=0.0, posinf=100.0, neginf=-100.0)
        # Clip to prevent overflow
        logits = np.clip(logits, -100, 100)
        probs = softmax(logits, axis=-1)
        # Ensure valid probabilities
        probs = np.clip(probs, 1e-10, 1.0)
        probs = probs / probs.sum(axis=-1, keepdims=True)
        return probs

    def _predict_pytorch(self, model, windows: np.ndarray) -> np.ndarray:
        """Get softmax probabilities from a PyTorch model, averaged across windows."""
        X = torch.FloatTensor(windows).unsqueeze(1).to(self.device)
        
        with torch.no_grad():
            logits = model(X).cpu().numpy()
        
        probs = self._safe_softmax(logits)
        avg_probs = probs.mean(axis=0)
        # Re-normalize after averaging
        avg_probs = avg_probs / avg_probs.sum()
        return avg_probs

    def _predict_minirocket(self, ds_signal: np.ndarray) -> np.ndarray:
        """Get pseudo-probabilities from MiniRocket."""
        if self.minirocket is None:
            return np.ones(NUM_CLASSES) / NUM_CLASSES

        try:
            X = ds_signal.reshape(1, 1, -1)
            features = self.minirocket['minirocket'].transform(X)
            scaled = self.minirocket['scaler'].transform(features)
            scores = self.minirocket['classifier'].decision_function(scaled)
            probs = self._safe_softmax(scores.flatten())
            return probs
        except Exception as e:
            print(f"MiniRocket prediction failed: {e}")
            return np.ones(NUM_CLASSES) / NUM_CLASSES

    def predict(self, signal: np.ndarray) -> dict:
        """Full prediction pipeline for a single signal."""
        data = self.preprocess(signal)

        # Get probabilities from each model
        probs = {}
        if self.wavenet:
            try:
                probs['wavenet'] = self._predict_pytorch(self.wavenet, data['windows'])
            except Exception as e:
                print(f"WaveNet failed: {e}")
        if self.inception:
            try:
                probs['inceptiontime'] = self._predict_pytorch(self.inception, data['windows'])
            except Exception as e:
                print(f"InceptionTime failed: {e}")
        if self.minirocket:
            probs['minirocket'] = self._predict_minirocket(data['ds_signal'])

        if not probs:
            # All models failed — return uniform
            probs['fallback'] = np.ones(NUM_CLASSES) / NUM_CLASSES

        # Ensemble: simple average
        all_probs = np.array(list(probs.values()))
        ensemble_probs = all_probs.mean(axis=0)
        # Final normalization to guarantee sum = 1
        ensemble_probs = np.clip(ensemble_probs, 1e-10, 1.0)
        ensemble_probs = ensemble_probs / ensemble_probs.sum()

        # Predicted class
        pred_class = int(np.argmax(ensemble_probs)) + 1
        confidence = float(ensemble_probs[pred_class - 1])

        # DSI and RUL
        info = DAMAGE_INFO[pred_class]
        dsi = info['dsi']
        rul = T_DESIGN * (1 - dsi) ** K_DEGRADE

        # Monte Carlo RUL
        rul_samples = self._monte_carlo_rul(ensemble_probs)

        # Severity and action
        if dsi < 0.1:
            severity, action = 'Healthy', 'No action needed. Continue routine monitoring.'
        elif dsi < 0.3:
            severity, action = 'Minor', 'Schedule inspection within 6 months. Monitor for progression.'
        elif dsi < 0.5:
            severity, action = 'Moderate', 'Detailed inspection required within 3 months. Consider load restrictions.'
        elif dsi < 0.7:
            severity, action = 'Severe', 'Immediate detailed inspection. Implement load restrictions. Plan repairs.'
        elif dsi < 0.9:
            severity, action = 'Critical', 'URGENT: Restrict traffic immediately. Emergency structural assessment needed.'
        else:
            severity, action = 'Extreme', 'EMERGENCY: Close bridge immediately. Imminent structural failure risk.'

        return {
            'predicted_class': pred_class,
            'class_name': info['name'],
            'damage_type': info['type'],
            'confidence': round(confidence, 4),
            'severity': severity,
            'dsi': round(dsi, 3),
            'rul_years': round(rul, 1),
            'rul_ci_low': round(rul_samples['ci_5'], 1),
            'rul_ci_high': round(rul_samples['ci_95'], 1),
            'recommended_action': action,
            'model_probabilities': {
                name: [round(float(p), 4) for p in prob]
                for name, prob in probs.items()
            },
            'ensemble_probabilities': [round(float(p), 4) for p in ensemble_probs],
            'all_classes': [
                {
                    'class': c,
                    'name': DAMAGE_INFO[c]['name'],
                    'probability': round(float(ensemble_probs[c-1]), 4),
                }
                for c in range(1, 18)
            ],
        }

    def _monte_carlo_rul(self, probs: np.ndarray, n_samples: int = 10000) -> dict:
        """Compute RUL confidence intervals via Monte Carlo sampling."""
        dsi_array = np.array([DAMAGE_INFO[c+1]['dsi'] for c in range(17)])
        sampled = np.random.choice(17, size=n_samples, p=probs)
        sampled_dsi = dsi_array[sampled]
        sampled_rul = T_DESIGN * (1 - sampled_dsi) ** K_DEGRADE
        return {
            'mean': float(np.mean(sampled_rul)),
            'median': float(np.median(sampled_rul)),
            'ci_5': float(np.percentile(sampled_rul, 5)),
            'ci_95': float(np.percentile(sampled_rul, 95)),
        }

    def get_status(self) -> dict:
        return {
            'wavenet': self.wavenet is not None,
            'inceptiontime': self.inception is not None,
            'minirocket': self.minirocket is not None,
            'device': str(self.device),
        }