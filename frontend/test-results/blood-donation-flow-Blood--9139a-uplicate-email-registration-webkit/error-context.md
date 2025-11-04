# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"./Pages/BloodBankRegister\" from \"src/App.jsx\". Does the file exist?"
  - generic [ref=e5]: D:/BloodDonation/frontend/src/App.jsx:12:30
  - generic [ref=e6]: 29 | import DonorRegister from "./Pages/DonorRegister"; 30 | import UserRegister from "./Pages/UserRegister"; 31 | import BloodBankRegister from "./Pages/BloodBankRegister"; | ^ 32 | import BloodBankLogin from "./Pages/BloodBankLogin"; 33 | import BloodBankDashboard from "./Pages/BloodBankDashboard";
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:31422:43) at TransformPluginContext.error (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:31419:14) at normalizeUrl (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:29891:18) at async file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:29949:32 at async Promise.all (index 10) at async TransformPluginContext.transform (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:29917:4) at async EnvironmentPluginContainer.transform (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:31220:14) at async loadAndTransform (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:26307:26) at async viteTransformMiddleware (file:///D:/BloodDonation/frontend/node_modules/vite/dist/node/chunks/dep-Bj7gA1-0.js:27392:20)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.js
    - text: .
```