export async function load({ locals }) {
  //  return the session data from locals that was set in hooks.server.js
  console.log('locals',locals)
  return {
    session: locals?.sessionData || {}
  };
}