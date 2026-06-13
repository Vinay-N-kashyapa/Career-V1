"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("./src/lib/firebase");
const client_1 = require("./src/lib/api/client");
const supabaseClient_1 = require("./src/lib/supabaseClient");
// ── Mock Supabase Auth Session ──────────────────────────────────────────────────
supabaseClient_1.supabase.auth.getSession = async () => ({
    data: {
        session: {
            user: { id: 'test-user-uid', email: 'test@pinit.app', user_metadata: { display_name: 'Test User' } }
        }
    },
    error: null
});
async function runTests() {
    console.log('🧪 Starting Automated Whitebox & Endpoint Testing...\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, message) {
        if (condition) {
            console.log(`  ✓ PASSED: ${message}`);
            passed++;
        }
        else {
            console.log(`  ❌ FAILED: ${message}`);
            failed++;
        }
    }
    try {
        // Test 1: Query Parameter Stripping & Routing
        console.log('Testing Test 1: Query Parameter Routing on Opportunities...');
        const oppsRes = await client_1.api.get('/api/opportunities?search=React');
        assert(Array.isArray(oppsRes.opportunities), 'Opportunities endpoint handles query params and returns opportunities array.');
        assert(oppsRes.opportunities.length > 0, 'Opportunities array is not empty.');
        // Test 2: Consultant Analytics
        console.log('\nTesting Test 2: Consultant Analytics...');
        const cAnalytics = await client_1.api.get('/api/consultant/analytics');
        assert(cAnalytics.totalStudents === 42, 'Consultant analytics returns totalStudents = 42.');
        assert(cAnalytics.totalRevenue === 1200000, 'Consultant analytics returns totalRevenue.');
        assert(cAnalytics.visaApprovalRate === 95, 'Consultant analytics returns visaApprovalRate.');
        assert(cAnalytics.offerRate === 88, 'Consultant analytics returns offerRate.');
        // Test 3: Consultant Student Addition & Pipeline Sync
        console.log('\nTesting Test 3: Consultant Pipeline and Student Add...');
        // Seed/add student
        await client_1.api.post('/api/consultant/student/add', {
            displayName: 'Ashwanth Kumar',
            email: 'ashwanth@pinit.app',
            phone: '9988776655',
            targetCountry: 'USA',
            programType: 'MS CS'
        });
        // Retrieve pipeline
        const pipelineRes = await client_1.api.get('/api/consultant/pipeline');
        assert(pipelineRes.pipeline !== undefined, 'Consultant pipeline is defined.');
        assert(Array.isArray(pipelineRes.pipeline.onboarding), 'Pipeline onboarding stage is an array.');
        const seededStudent = pipelineRes.pipeline.onboarding.find((s) => s.displayName === 'Ashwanth Kumar');
        assert(seededStudent !== undefined, 'Seeded student found in onboarding pipeline.');
        // Test 4: Consultant Student Update
        if (seededStudent) {
            console.log('\nTesting Test 4: Consultant Student Status Update...');
            const studentId = seededStudent.id;
            await client_1.api.patch(`/api/consultant/student/${studentId}`, { status: 'visa', visa_status: 'pending' });
            const pipelineUpdated = await client_1.api.get('/api/consultant/pipeline');
            const updatedStudent = pipelineUpdated.pipeline.visa.find((s) => s.id === studentId);
            assert(updatedStudent !== undefined, 'Student successfully moved from onboarding to visa stage.');
            assert(updatedStudent?.visa_status === 'pending', 'Student visa status updated successfully.');
        }
        // Test 5: Admin Panel users listing
        console.log('\nTesting Test 5: Admin Dashboard and Users list...');
        const adminDashboard = await client_1.api.get('/api/admin/dashboard');
        assert(adminDashboard.users && typeof adminDashboard.users.total === 'number', 'Admin dashboard fetches users metrics.');
        const adminUsers = await client_1.api.get('/api/admin/users?role=student');
        assert(Array.isArray(adminUsers.users), 'Admin users list is returned as array.');
        assert(adminUsers.users.length > 0, 'Admin users list contains seeded students.');
        // Test 6: Recruiter candidates list
        console.log('\nTesting Test 6: Recruiter Candidate Search...');
        const recruiterAnalytics = await client_1.api.get('/api/recruiter/analytics');
        assert(recruiterAnalytics.analytics.total_students > 0, 'Recruiter analytics computes dynamic student count.');
        const recruiterCandidates = await client_1.api.get('/api/recruiter/candidates?domain=React');
        assert(Array.isArray(recruiterCandidates.candidates), 'Recruiter candidate list is returned.');
        assert(recruiterCandidates.candidates.length > 0, 'Recruiter finds student candidates.');
        // Test 7: Sentinel Fingerprint schema check
        console.log('\nTesting Test 7: Sentinel Cryptographic DNA Schema...');
        const sentinelPrint = await client_1.api.get('/api/sentinel/fingerprint');
        assert(sentinelPrint.sha256 !== undefined, 'Sentinel fingerprint returns SHA-256 hash.');
        assert(Array.isArray(sentinelPrint.layers), 'Sentinel fingerprint returns DNA layers array.');
        assert(sentinelPrint.sessionSignature !== undefined, 'Sentinel fingerprint returns session signature.');
        const sentinelSearch = await client_1.api.post('/api/sentinel/search-similar', { text: 'engineering resume draft' });
        assert(Array.isArray(sentinelSearch.matches), 'Sentinel similarity search returns matches array.');
        assert(sentinelSearch.matches.length > 0, 'Sentinel search identifies similar resumes.');
    }
    catch (err) {
        console.error('❌ Test runner encountered error:', err);
        failed++;
    }
    console.log('\n=======================================');
    console.log(`🏁 Test run completed: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================');
    if (failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runTests();
