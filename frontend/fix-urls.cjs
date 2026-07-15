const fs = require('fs');
const files = [
  'src/pages/Asset.vue',
  'src/pages/AssetDetail.vue',
  'src/pages/SelfServiceBorrow.vue',
  'src/stores/assetStore.ts',
  'src/stores/authStore.ts',
  'src/stores/employeeStore.ts',
  'src/stores/settingStore.ts',
  'src/stores/transactionStore.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const API_URL = 'http:\/\/:3000\/api'/g, 'const API_URL = `http://${window.location.hostname}:3000/api`');
  fs.writeFileSync(f, content);
});
