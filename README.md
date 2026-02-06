# laser-reveal-effect

React canvas laser reveal effect component and hook.

<p align="center">
  <img src="docs/gif/s64_ccc.gif" alt="" />
</p>

## Install

```bash
npm install laser-reveal-effect
```

## Usage

```tsx
import { LaserCanvas } from "laser-reveal-effect";

export function Demo() {
  return (
    <LaserCanvas
      imageSrc="/sample.jpg"
      options={{
        laserSize: 64,
        backgroundColor: "#ccc",
        // orderMode: "ltr",
      }}
    />
  );
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `laserSize` | `number` | `16` | レーザーのサイズ（px） |
| `laserEnabled` | `boolean` | `true` | レーザー描画の有効/無効 |
| `backgroundColor` | `string` | `transparent` | 背景色 |
| `durationMs` | `number` | `6000` | 完了までの時間（ms） |
| `orderMode` | `ltr \| rtl \| zigzag \| random` | `ltr` | 復元順序（`ltr`: 左→右、`rtl`: 右→左、`zigzag`: 行ごとに左右交互、`random`: ランダム） |

## Examples

| ltr | rtl |
|:-------:|:-------:|
| <img src="docs/gif/ltr.gif" width="300"> | <img src="docs/gif/rtl.gif" width="300"> |

| zigzag | random |
|:-------:|:-------:|
| <img src="docs/gif/zigzag.gif" width="300"> | <img src="docs/gif/random.gif" width="300"> |
