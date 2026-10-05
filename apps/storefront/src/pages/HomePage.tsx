import { useStore } from '../store';
import { SectionList } from '../sections/Sections';

export default function HomePage() {
  const { store } = useStore();
  if (!store) return null;
  // The announcement bar renders in the shell (above the header).
  return <SectionList sections={store.theme.sections.filter(s => s.type !== 'announcement')} />;
}
