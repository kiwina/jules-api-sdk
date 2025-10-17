import { JulesClient } from '../src';

/**
 * Comprehensive example demonstrating all Jules API SDK methods
 */
async function comprehensiveExample() {
  const client = new JulesClient({
    apiKey: process.env.JULES_API_KEY || 'YOUR_API_KEY_HERE'
  });

  try {
    // ========================================
    // SOURCES API
    // ========================================
    console.log('📚 === SOURCES API ===\n');

    // 1. List all sources
    console.log('1️⃣  Listing all sources...');
    const sourcesResponse = await client.listSources(10);
    console.log(`   Found ${sourcesResponse.sources?.length || 0} sources`);
    if (sourcesResponse.sources && sourcesResponse.sources.length > 0) {
      sourcesResponse.sources.forEach(source => {
        console.log(`   - ${source.name} (${source.id})`);
        if (source.githubRepo) {
          console.log(`     GitHub: ${source.githubRepo.owner}/${source.githubRepo.repo}`);
        }
      });
    }

    if (!sourcesResponse.sources || sourcesResponse.sources.length === 0) {
      console.log('\n❌ No sources found. Please connect a GitHub repository in Jules first.');
      console.log('   Visit: https://jules.google.com\n');
      return;
    }

    // 2. Get specific source details
    const firstSource = sourcesResponse.sources[0];
    console.log(`\n2️⃣  Getting details for source: ${firstSource.id}`);
    const sourceDetails = await client.getSource(firstSource.id!);
    console.log(`   Name: ${sourceDetails.name}`);
    if (sourceDetails.githubRepo) {
      console.log(`   Repo: ${sourceDetails.githubRepo.owner}/${sourceDetails.githubRepo.repo}`);
      console.log(`   Default branch: ${sourceDetails.githubRepo.defaultBranch}`);
    }

    // ========================================
    // SESSIONS API
    // ========================================
    console.log('\n\n🎯 === SESSIONS API ===\n');

    // 3. Create a new session
    console.log('3️⃣  Creating a new session...');
    const session = await client.createSession({
      prompt: 'Create a simple "Hello World" web page with some basic styling',
      sourceContext: {
        source: firstSource.name!,
        githubRepoContext: {
          startingBranch: 'main'
        }
      },
      title: 'Comprehensive Example Session',
      requirePlanApproval: false
    });
    const sessionId = session.id!;
    console.log(`   ✅ Created session: ${sessionId}`);
    console.log(`   📝 Title: ${session.title}`);
    console.log(`   🎯 Prompt: ${session.prompt}`);
    console.log(`   Status: ${session.state}`);

    // 4. List all sessions
    console.log('\n4️⃣  Listing all sessions...');
    const sessionsResponse = await client.listSessions(5);
    console.log(`   Found ${sessionsResponse.sessions?.length || 0} sessions`);
    if (sessionsResponse.sessions) {
      sessionsResponse.sessions.slice(0, 3).forEach(s => {
        console.log(`   - ${s.title} (${s.id})`);
      });
    }

    // 5. Get specific session details
    console.log(`5️⃣  Getting details for session: ${sessionId}`);
    const sessionDetails = await client.getSession(sessionId);
    console.log(`   Title: ${sessionDetails.title}`);
    console.log(`   Status: ${sessionDetails.state}`);
    console.log(`   Created: ${sessionDetails.createTime}`);

    // Wait for Jules to start working
    console.log('\n⏳ Waiting for Jules to start working (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========================================
    // ACTIVITIES API
    // ========================================
    console.log('\n\n📋 === ACTIVITIES API ===\n');

    // 6. List activities for the session
    console.log('\n📋 Listing activities...');
    const activitiesResponse = await client.listActivities(sessionId, 20);
    const activities = activitiesResponse.activities || [];
    console.log(`   Found ${activities.length} activities:`);
    activities.forEach((activity, idx) => {
      console.log(`\n   Activity ${idx + 1}: ${activity.name}`);
      console.log(`   Description: ${activity.description.substring(0, 80)}...`);
      console.log(`   Type: ${activity._activityType}`);
      
      // Type-safe handling of discriminated union
      switch (activity._activityType) {
        case 'agentMessaged':
          console.log(`   Agent said: "${activity.agentMessaged.agentMessage.substring(0, 60)}..."`);
          break;
        case 'userMessaged':
          console.log(`   User said: "${activity.userMessaged.userMessage.substring(0, 60)}..."`);
          break;
        case 'planGenerated':
          console.log(`   Plan generated with ${activity.planGenerated.plan.steps?.length || 0} steps`);
          break;
        case 'planApproved':
          console.log(`   Plan approved: ${activity.planApproved.planId}`);
          break;
        case 'progressUpdated':
          console.log(`   Progress: ${activity.progressUpdated.title || 'Working...'}`);
          break;
        case 'sessionCompleted':
          console.log(`   ✅ Session completed successfully`);
          break;
        case 'sessionFailed':
          console.log(`   ❌ Session failed: ${activity.sessionFailed.reason || 'Unknown reason'}`);
          break;
      }
      
      // Handle artifacts if present
      if (activity.artifacts && activity.artifacts.length > 0) {
        console.log(`   Artifacts: ${activity.artifacts.length}`);
        activity.artifacts.forEach((artifact, artifactIdx) => {
          switch (artifact._artifactType) {
            case 'changeSet':
              console.log(`      - ChangeSet for ${artifact.changeSet.source || 'unknown source'}`);
              break;
            case 'media':
              console.log(`      - Media: ${artifact.media.mimeType || 'unknown type'}`);
              break;
            case 'bashOutput':
              console.log(`      - Bash: ${artifact.bashOutput.command || 'unknown command'} (exit: ${artifact.bashOutput.exitCode})`);
              break;
          }
        });
      }
    });

    // 7. Get specific activity details
    if (activities.length > 0) {
      const firstActivity = activities[0];
      console.log(`\n7️⃣  Getting details for activity: ${firstActivity.id}`);
      const activityDetails = await client.getActivity(sessionId, firstActivity.id);
      console.log(`   Name: ${activityDetails.name}`);
      console.log(`   Type: ${activityDetails._activityType}`);
      console.log(`   Description: ${activityDetails.description.substring(0, 100)}...`);
      console.log(`   Artifacts: ${activityDetails.artifacts?.length || 0}`);
      if (activityDetails.artifacts && activityDetails.artifacts.length > 0) {
        activityDetails.artifacts.forEach((artifact, idx) => {
          console.log(`      Artifact ${idx + 1}: ${artifact._artifactType}`);
        });
      }
    }

    // ========================================
    // MESSAGING API
    // ========================================
    console.log('\n\n💬 === MESSAGING API ===\n');

    // 8. Send a message to the session
    console.log('8️⃣  Sending a follow-up message...');
    await client.sendMessage(sessionId, 'Please add a colorful gradient background to the page.');
    console.log('   ✅ Message sent successfully');
    console.log('   Jules will process this and create new activities');

    // ========================================
    // PLAN APPROVAL (Optional workflow)
    // ========================================
    console.log('\n\n✅ === PLAN APPROVAL API ===\n');

    // 9. Approve plan (demonstration - this session doesn't require approval)
    console.log('9️⃣  Plan approval example:');
    console.log('   Note: This session was created with requirePlanApproval=false');
    console.log('   If requirePlanApproval=true, you would call:');
    console.log(`   await client.approvePlan('${sessionId}')`);
    console.log('   This tells Jules to proceed with the proposed plan.');

    // Example of creating a session that requires plan approval
    console.log('\n   Creating a session WITH plan approval requirement...');
    const approvalSession = await client.createSession({
      prompt: 'Refactor the authentication module to use OAuth2',
      sourceContext: {
        source: firstSource.name!,
        githubRepoContext: {
          startingBranch: 'main'
        }
      },
      title: 'Approval Required Example',
      requirePlanApproval: true
    });
    console.log(`   ✅ Created session: ${approvalSession.id}`);
    console.log('   This session will wait for plan approval before proceeding');
    
    // In a real scenario, you would:
    // 1. Wait for Jules to generate a plan
    // 2. Review the plan activities
    // 3. Call approvePlan() to proceed
    // await client.approvePlan(approvalSession.id!);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n\n🎉 === SUMMARY ===\n');
    console.log('✅ Successfully demonstrated all 9 API methods:');
    console.log('   1. listSources()       - List available GitHub repositories');
    console.log('   2. getSource()         - Get specific source details');
    console.log('   3. createSession()     - Create a new Jules session');
    console.log('   4. listSessions()      - List all your sessions');
    console.log('   5. getSession()        - Get specific session details');
    console.log('   6. listActivities()    - List activities in a session');
    console.log('   7. getActivity()       - Get specific activity details');
    console.log('   8. sendMessage()       - Send messages to Jules');
    console.log('   9. approvePlan()       - Approve plans (when required)');
    console.log('\n📖 For more info: https://developers.google.com/jules/api\n');

  } catch (error) {
    console.error('\n❌ Error occurred:', error instanceof Error ? error.message : String(error));
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('   Status:', axiosError.response?.status);
      console.error('   Data:', JSON.stringify(axiosError.response?.data, null, 2));
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  comprehensiveExample().catch(console.error);
}

export { comprehensiveExample };
