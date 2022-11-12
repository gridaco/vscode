const welcome_grida_explorer_live = {
  view: "grida-explorer-live",
  contents:
    "From Live, you can instantly integrate your design selection into your workspace. Select your design from Figma via Assistant\n[Open Figma](https://figma.com/files), [Install Assistant](https://www.figma.com/community/plugin/896445082033423994/), Select a node.\n[Learn how](command:grida.signin)",
};

module.exports = {
  activationEvents: [
    "*",
    "onAuthenticationRequest:grida",
    "onCommand:grida-vscode-extension.enter-assistant-live-session",
    "onCommand:grida-open-v-doc",
    "onCommand:grida-open-v-doc-load-from-input-url",
    "onWebviewPanel:grida-vscode-extension",
    "onView:grida-explorer",
    "onView:grida-explorer-project-scenes",
    "onView:grida-explorer-live",
    "onView:grida-explorer-help-and-feedback",
    "onView:grida-explorer-preview",
  ],
  enabledApiProposals: ["inlineCompletions", "inlineCompletionsAdditions"],
  main: "./dist/extension.js",
  capabilities: {
    virtualWorkspaces: true,
    untrustedWorkspaces: {
      supported: true,
    },
  },
  contributes: {
    authentication: [
      {
        label: "Grida",
        id: "grida",
      },
    ],
    commands: [
      {
        command: "extension.inline-completion-settings",
        title: "Inline Completion Settings",
      },
      {
        command: "grida-vscode-extension.enter-assistant-live-session",
        title: "Enter live session",
      },
      {
        command: "grida-open-v-doc-load-from-input-url",
        title: "From Figma Url",
        category: "Load Design",
      },
      {
        command: "grida-explorer.refresh",
        title: "Refresh",
        icon: {
          light: "resources/light/refresh.svg",
          dark: "resources/dark/refresh.svg",
        },
      },
      {
        command: "grida-explorer-preview.open-in-editor",
        title: "Open in editor",
        icon: {
          light: "resources/light/open-in-new.svg",
          dark: "resources/dark/open-in-new.svg",
        },
      },
      {
        command: "grida-explorer.switch-workspace",
        title: "Switch Grida Workspace",
      },
      {
        command: "grida-explorer.add",
        title: "Add",
      },
      {
        command: "grida-explorer.open-in-grida",
        title: "Open in Grida",
      },
      {
        command: "grida-explorer.edit",
        title: "Edit",
        icon: {
          light: "resources/light/edit.svg",
          dark: "resources/dark/edit.svg",
        },
      },
    ],
    viewsContainers: {
      activitybar: [
        {
          id: "grida-explorer",
          title: "Grida",
          icon: "media/activity-bar-icon.svg",
        },
      ],
    },
    views: {
      "grida-explorer": [
        {
          id: "grida-explorer-live",
          name: "Live",
          type: "tree",
          contextualTitle: "Live",
        },
        // {
        //   id: "grida-explorer-project-scenes",
        //   name: "Scenes / Components",
        //   type: "tree",
        //   contextualTitle: "Components",
        // },
        {
          id: "grida-explorer-preview",
          name: "Preview",
          type: "webview",
          contextualTitle: "Preview",
          visibility: "hidden",
        },
        {
          id: "grida-explorer-help-and-feedback",
          name: "Help and feedback",
          contextualTitle: "Help and feedback",
          visibility: "collapsed",
        },
      ],
      explorer: [
        // {
        //   id: "grida-hierarchy",
        //   name: "Grida",
        // },
      ],
    },
    viewsWelcome: [
      {
        view: "grida-explorer",
        contents:
          "Welcome to Grida for VSCode. [learn more](https://www.grida.co/).\n[Signin](command:grida.signin)",
      },
      welcome_grida_explorer_live,
    ],
    menus: {
      "editor/inlineCompletions/actions": [
        {
          command: "extension.inline-completion-settings",
        },
      ],
      "view/title": [
        {
          command: "grida-explorer.refresh",
          when: "view == grida-explorer-project-scenes",
          group: "navigation",
        },
        {
          command: "grida-explorer-preview.open-in-editor",
          when: "view == grida-explorer-preview",
          group: "navigation",
        },
        {
          command: "grida-explorer.add",
          when: "view == grida-explorer-project-scenes",
        },
        {
          command: "grida-explorer.switch-workspace",
          when: "view == grida-explorer-project-scenes",
        },
      ],
      "view/item/context": [
        {
          command: "grida-explorer.edit",
          when: "view == grida-explorer-project-scenes && viewItem == project",
          group: "inline",
        },
      ],
    },
    configuration: {
      title: "Grida",
      properties: {
        "design2code.framework": {
          type: "string",
          enum: ["auto", "react", "flutter", "vanilla"],
          enumDescriptions: [
            "automatically configures framework options",
            "use ReactJS (tsx, jsx)",
            "use Flutter (dart)",
            "use html/css & vanilla js",
          ],
          default: "auto",
          markdownDescription:
            "Default front-end framework to use. [Learn more](https://github.com/gridaco/designto-code).",
        },
        "linkedAccounts.figma.personalAccessToken": {
          type: "string",
          markdownDescription:
            "Personal access token to authorize figma api. [Learn how](https://www.grida.co/docs/with-figma/guides/how-to-get-personal-access-token).",
        },
        "linkedAccounts.github.personalAccessToken": {
          type: "string",
          markdownDescription: "Personal access token to authorize github api.",
        },
      },
    },
  },
};
