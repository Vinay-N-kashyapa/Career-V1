import QuestWorkspaceClient from '@/components/quests/QuestWorkspaceClient';
import { QUESTS_REGISTRY } from '@/lib/data/questsData';

interface QuestPageProps {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return QUESTS_REGISTRY.map(q => ({
    id: q.id
  }));
}

export default function QuestWorkspacePage({ params }: QuestPageProps) {
  return <QuestWorkspaceClient questId={params.id} />;
}
