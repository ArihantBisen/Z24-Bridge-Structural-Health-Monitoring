"""PyTorch model architectures for Z24 bridge damage classification."""

import torch
import torch.nn as nn


# ============================================================
# WaveNet v4
# ============================================================
class WaveNetBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel_size, dilation):
        super().__init__()
        self.pad = (kernel_size - 1) * dilation
        self.conv = nn.Conv1d(in_ch, out_ch * 2, kernel_size, dilation=dilation)
        self.bn = nn.BatchNorm1d(out_ch * 2)
        self.skip = nn.Conv1d(out_ch, out_ch, 1)
        self.res = nn.Conv1d(out_ch, out_ch, 1)
        self.proj = nn.Conv1d(in_ch, out_ch, 1) if in_ch != out_ch else None

    def forward(self, x):
        h = nn.functional.pad(x, (self.pad, 0))
        h = self.bn(self.conv(h))
        f, g = h.chunk(2, dim=1)
        h = torch.tanh(f) * torch.sigmoid(g)
        skip = self.skip(h)
        res = self.res(h)
        if self.proj:
            x = self.proj(x)
        return x + res, skip


class WaveNet(nn.Module):
    def __init__(self, num_classes=17, filters=48, num_stacks=2,
                 layers_per_stack=8, dropout=0.5):
        super().__init__()
        self.blocks = nn.ModuleList()
        for s in range(num_stacks):
            for l in range(layers_per_stack):
                in_ch = 1 if (s == 0 and l == 0) else filters
                self.blocks.append(WaveNetBlock(in_ch, filters, 2, 2**l))
        self.head = nn.Sequential(
            nn.ReLU(), nn.AdaptiveAvgPool1d(1), nn.Flatten(),
            nn.Dropout(dropout), nn.Linear(filters, 128),
            nn.ReLU(), nn.BatchNorm1d(128),
            nn.Dropout(dropout), nn.Linear(128, num_classes),
        )

    def forward(self, x):
        skips = []
        for block in self.blocks:
            x, s = block(x)
            skips.append(s)
        min_len = min(s.shape[2] for s in skips)
        x = sum(s[:, :, -min_len:] for s in skips)
        return self.head(x)


# ============================================================
# InceptionTime
# ============================================================
class InceptionModule(nn.Module):
    def __init__(self, in_channels, n_filters=32, kernel_sizes=(10, 20, 40),
                 bottleneck_size=32):
        super().__init__()
        self.bottleneck = nn.Conv1d(in_channels, bottleneck_size, 1, bias=False)
        self.convs = nn.ModuleList([
            nn.Conv1d(bottleneck_size, n_filters, k, padding='same', bias=False)
            for k in kernel_sizes
        ])
        self.maxpool = nn.MaxPool1d(3, stride=1, padding=1)
        self.maxpool_conv = nn.Conv1d(in_channels, n_filters, 1, bias=False)
        self.bn = nn.BatchNorm1d(n_filters * (len(kernel_sizes) + 1))
        self.relu = nn.ReLU()

    def forward(self, x):
        x_bottle = self.bottleneck(x)
        conv_outputs = [conv(x_bottle) for conv in self.convs]
        mp_out = self.maxpool_conv(self.maxpool(x))
        min_len = min(c.shape[2] for c in conv_outputs + [mp_out])
        conv_outputs = [c[:, :, :min_len] for c in conv_outputs]
        mp_out = mp_out[:, :, :min_len]
        x = torch.cat(conv_outputs + [mp_out], dim=1)
        return self.relu(self.bn(x))


class InceptionBlock(nn.Module):
    def __init__(self, in_channels, n_filters=32, kernel_sizes=(10, 20, 40)):
        super().__init__()
        out_channels = n_filters * (len(kernel_sizes) + 1)
        self.inception1 = InceptionModule(in_channels, n_filters, kernel_sizes)
        self.inception2 = InceptionModule(out_channels, n_filters, kernel_sizes)
        self.inception3 = InceptionModule(out_channels, n_filters, kernel_sizes)
        self.residual = nn.Sequential(
            nn.Conv1d(in_channels, out_channels, 1, bias=False),
            nn.BatchNorm1d(out_channels),
        )
        self.relu = nn.ReLU()

    def forward(self, x):
        residual = self.residual(x)
        x = self.inception1(x)
        x = self.inception2(x)
        x = self.inception3(x)
        min_len = min(x.shape[2], residual.shape[2])
        return self.relu(x[:, :, :min_len] + residual[:, :, :min_len])


class InceptionTime(nn.Module):
    def __init__(self, in_channels=1, num_classes=17, n_filters=32,
                 n_blocks=2, dropout=0.4):
        super().__init__()
        out_ch = n_filters * 4
        self.blocks = nn.ModuleList()
        for i in range(n_blocks):
            in_ch = in_channels if i == 0 else out_ch
            self.blocks.append(InceptionBlock(in_ch, n_filters))
        self.gap = nn.AdaptiveAvgPool1d(1)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(out_ch, num_classes)

    def forward(self, x):
        for block in self.blocks:
            x = block(x)
        x = self.gap(x).squeeze(-1)
        x = self.dropout(x)
        return self.fc(x)