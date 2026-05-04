interface WorkImageInput {
  title: string;
  image?: string;
  imageAlt?: string;
  cardLabel?: string;
  serviceType?: string;
}

interface ResolveWorkImageOptions {
  width?: number;
  height?: number;
}

const placeholderPalettes = [
  { bg: "f5f5f4", fg: "18181b" },
  { bg: "e0f2fe", fg: "082f49" },
  { bg: "ede9fe", fg: "312e81" },
  { bg: "fef3c7", fg: "78350f" },
  { bg: "dcfce7", fg: "14532d" },
];

function hashValue(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function resolveWorkImage(
  input: WorkImageInput,
  options: ResolveWorkImageOptions = {},
) {
  const width = options.width ?? 1600;
  const height = options.height ?? 900;
  const fallbackAlt = input.imageAlt ?? `${input.title} project visual`;

  if (input.image) {
    return {
      src: input.image,
      alt: fallbackAlt,
      isPlaceholder: false,
    };
  }

  const palette = placeholderPalettes[hashValue(input.title) % placeholderPalettes.length];
  const label = encodeURIComponent(input.cardLabel ?? input.serviceType ?? input.title);

  return {
    src: `https://placehold.co/${width}x${height}/${palette.bg}/${palette.fg}?text=${label}`,
    alt: fallbackAlt,
    isPlaceholder: true,
  };
}

export function getWorkImageTreatmentClass(index: number) {
  return `work-image-treatment-${index % 5}`;
}
