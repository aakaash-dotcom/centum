export interface MaterialTypeDefinition {
  id: 'videos' | 'concept' | 'notes' | 'papers' | 'textbooks' | 'diagrams' | 'handwritten';
  labelEn: string;
  labelTa: string;
  icon: string;
  status: 'live' | 'coming';
  descriptionEn: string;
  descriptionTa: string;
}

/**
 * Unified single taxonomy for all learning material types across Centum.
 * Replaces the 3 fragmented systems:
 * 1. proMaterials
 * 2. Materials page sections
 * 3. Papers categories
 */
export const MATERIAL_TYPES: MaterialTypeDefinition[] = [
  {
    id: 'videos',
    labelEn: 'Video Lessons',
    labelTa: 'வீடியோ வகுப்புகள்',
    icon: '▶',
    status: 'coming', // Founder is holding the video pipeline; stays "Coming soon"
    descriptionEn: 'Chapter video masterclasses with step-by-step breakdown',
    descriptionTa: 'பாட தலைப்பு விளக்க வீடியோ வகுப்புகள்',
  },
  {
    id: 'concept',
    labelEn: 'Concept Quiz',
    labelTa: 'கருத்துத் தேர்வு',
    icon: '🧠',
    status: 'live',
    descriptionEn: 'Chapter-by-chapter concept practice & speed drill',
    descriptionTa: 'பாடவாரியான கருத்துத் தேர்வுகள்',
  },
  {
    id: 'notes',
    labelEn: 'Notes & Formula Sheets',
    labelTa: 'நோட்டுகள் & சூத்திரங்கள்',
    icon: '📝',
    status: 'coming',
    descriptionEn: 'High-yield revision notes & key formula sheets',
    descriptionTa: 'முக்கிய திருப்புதல் குறிப்புகள் & சூத்திரங்கள்',
  },
  {
    id: 'papers',
    labelEn: 'PYQ & Solved Papers',
    labelTa: 'முந்தைய வினாத்தாள்கள்',
    icon: '📄',
    status: 'live',
    descriptionEn: 'Previous year board papers & model question sets with solutions',
    descriptionTa: 'அரசு பொதுத்தேர்வு & மாதிரி வினாத்தாள்கள்',
  },
  {
    id: 'textbooks',
    labelEn: 'Samacheer Textbooks',
    labelTa: 'பாடநூல்கள்',
    icon: '📚',
    status: 'live',
    descriptionEn: 'Official Tamil Nadu state board digital textbooks & unit guides',
    descriptionTa: 'அரசு பாடநூல் மின்புத்தகங்கள்',
  },
  {
    id: 'diagrams',
    labelEn: 'Important Diagrams',
    labelTa: 'வரைபடங்கள்',
    icon: '🎨',
    status: 'coming',
    descriptionEn: 'High-yield labeled biology diagrams, ray optics & circuit laws',
    descriptionTa: 'கட்டாய தேர்வு வரைபடங்கள் & விளக்கப்படங்கள்',
  },
  {
    id: 'handwritten',
    labelEn: 'Handwritten Topper Sheets',
    labelTa: 'கையேடுகள் & விடைத்தாள்கள்',
    icon: '✍️',
    status: 'coming',
    descriptionEn: 'Original answer sheets of 100/100 state rankers with evaluator notes',
    descriptionTa: 'டாப்பர்களின் அசல் மாதிரி விடைத்தாள்கள்',
  },
];

export function getMaterialType(id: string): MaterialTypeDefinition | undefined {
  return MATERIAL_TYPES.find((m) => m.id === id);
}
