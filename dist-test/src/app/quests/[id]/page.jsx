"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.default = QuestWorkspacePage;
const QuestWorkspaceClient_1 = __importDefault(require("@/components/quests/QuestWorkspaceClient"));
const questsData_1 = require("@/lib/data/questsData");
function generateStaticParams() {
    return questsData_1.QUESTS_REGISTRY.map(q => ({
        id: q.id
    }));
}
function QuestWorkspacePage({ params }) {
    return <QuestWorkspaceClient_1.default questId={params.id}/>;
}
