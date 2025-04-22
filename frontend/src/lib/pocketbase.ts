  // src/lib/pocketbase.js
import PocketBase from 'pocketbase';

// adjust the URL if your server is hosted differently
const pb = new PocketBase('http://rpidorms.cs.rpi.edu:8090');

// Auto-auth if token exists in cookies
// PocketBase automatically uses cookies by default
// No need to manually load from localStorage
pb.authStore.onChange(() => {
  // You can add hooks here if needed when auth state changes
});

export default pb;