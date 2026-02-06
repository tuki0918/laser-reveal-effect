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
| `laserSize` | `number` | `16` | Laser size (px) |
| `laserEnabled` | `boolean` | `true` | Enable/disable laser drawing |
| `backgroundColor` | `string` | `transparent` | Background color |
| `durationMs` | `number` | `6000` | Time to completion (ms) |
| `orderMode` | `ltr \| rtl \| zigzag \| random` | `ltr` | Restore order (`ltr`: left to right, `rtl`: right to left, `zigzag`: alternate left/right per row, `random`: random) |

## Examples

| ltr | rtl |
|:-------:|:-------:|
| <img src="docs/gif/ltr.gif" width="300"> | <img src="docs/gif/rtl.gif" width="300"> |

| zigzag | random |
|:-------:|:-------:|
| <img src="docs/gif/zigzag.gif" width="300"> | <img src="docs/gif/random.gif" width="300"> |
