(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent);
 const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 const original={importItemsIfEmpty,loadCampaigns,loadMyPendingInvites,loadMyDMRequest,loadUsers,loadDMRequests,loadDashboardCharacters};
 const info=console.info,error=console.error,logs=[],logReady=[],errors=[],calls=[];
 try{
  console.info=(...args)=>{logs.push(args);logReady.push(calls.at(-1)==='dashboard'&&document.getElementById('dashboardHome').style.display==='block')};console.error=(...args)=>errors.push(args);
  importItemsIfEmpty=async()=>calls.push('catalogue');
  loadCampaigns=async()=>{calls.push('campaigns');campaigns=[]};
  loadMyPendingInvites=async()=>calls.push('invites');loadMyDMRequest=async()=>calls.push('dm-request');
  loadUsers=async()=>calls.push('users');loadDMRequests=async()=>calls.push('dm-requests');
  loadDashboardCharacters=async()=>calls.push('dashboard');
  closeCharacterSheet(true);SiteHelp.onLogout();
  testSheetDocs['users/login-player']={name:'Mira',email:'mira@example.test',role:['player']};
  const account={uid:'login-player',email:'mira@example.test'};auth.currentUser=account;
  document.getElementById('passwordInput').value='never-log-this';
  await testAuthCallback(account);
  check('Successful account initialization emits one named login message',logs.length===1&&logs[0][0]==='Successfully logged in as Mira');
  check('Login success is reported after dashboard data loads',logReady[0]===true);
  check('Login message contains no password or account object',logs[0].length===1&&!logs[0][0].includes('never-log-this'));
  check('Player startup does not load global admin account lists',!calls.includes('users')&&!calls.includes('dm-requests'));
  check('Startup retains the player guide and account display',document.getElementById('siteGuideDialog').dataset.guideRole==='player'&&document.getElementById('userDisplay').textContent==='Mira');
  SiteHelp.onLogout();logs.length=0;calls.length=0;
  testSheetDocs['users/login-admin']={name:'Atlas admin',email:'admin@example.test',role:['admin']};
  auth.currentUser={uid:'login-admin',email:'admin@example.test'};await testAuthCallback(auth.currentUser);
  check('Admin startup still loads global users and DM requests',calls.includes('users')&&calls.includes('dm-requests')&&logs[0][0]==='Successfully logged in as Atlas admin');
  SiteHelp.onLogout();logs.length=0;
  loadCampaigns=async()=>{throw Error('Simulated dashboard failure')};
  await testAuthCallback(account);
  check('Failed startup never emits a successful-login message',logs.length===0&&errors.some(args=>args[0]==='Startup failed:'));
  check('Failed startup keeps the existing account error state',document.getElementById('userDisplay').textContent==='Failed to load account');
  auth.currentUser=null;await testAuthCallback(null);
  check('Sign-out clears private session data and restores public landing',currentUser===null&&activeCampaign===null&&characters.length===0&&inventory.length===0&&document.getElementById('publicLanding').style.display==='block'&&logs.length===0);
 }catch(e){results.push({name:e.stack,pass:false})}
 finally{
  ({importItemsIfEmpty,loadCampaigns,loadMyPendingInvites,loadMyDMRequest,loadUsers,loadDMRequests,loadDashboardCharacters}=original);
  console.info=info;console.error=error;document.getElementById('passwordInput').value='';
  SiteHelp.onLogout();seed('player');
 }
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
