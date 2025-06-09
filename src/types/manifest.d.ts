declare module "*.json" {
  const value: {
    manifest_version: 3;
    name: string;
    version: string;
    description: string;
    icons: {
      "16": string;
      "32": string;
      "128": string;
    };
    background: {
      service_worker: string;
      type: "module";
    };
    action: {
      default_popup: string;
      default_title: string;
    };
    options_page: string;
    content_scripts: Array<{
      matches: string[];
      js: string[];
      run_at: string;
    }>;
    permissions: string[];
    host_permissions: string[];
  };
  export default value;
}
