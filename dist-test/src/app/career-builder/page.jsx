"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = CareerBuilderPage;
const CareerBuilderClient_1 = __importDefault(require("./CareerBuilderClient"));
exports.metadata = {
    title: 'AI Trajectory Builder',
    description: 'Map out your SDE, DevOps, or Frontend engineering milestones. Align competencies with industry benchmarks.',
    openGraph: {
        title: 'PinIT AI Trajectory Builder — Build your Quest Roadmap',
        description: 'Construct a customized, gamified career roadmap targeting top-tier technical benchmarks.',
        type: 'website'
    }
};
function CareerBuilderPage() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "PinIT AI Career Trajectory Roadmaps",
        "description": "Custom SDE, DevOps, and Frontend developer milestone pathways and programming quests.",
        "provider": {
            "@type": "Organization",
            "name": "PinIT Career OS",
            "sameAs": "https://pinit.io"
        }
    };
    return (<>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
      <CareerBuilderClient_1.default />
    </>);
}
