# Privacy Policy for BetterGPT

**Last Updated: December 25, 2024**

## Introduction

BetterGPT ("we", "our", or "the extension") is committed to protecting your privacy. This privacy policy explains how BetterGPT handles data.

## Data Collection

**BetterGPT does NOT collect any personal data.**

The extension operates entirely within your browser and does not:
- Collect any personally identifiable information
- Track your browsing history
- Send data to external servers
- Use analytics or tracking tools
- Share data with third parties

## Data Storage

All data generated and used by BetterGPT is stored locally on your device using your browser's IndexedDB storage:

- **Conversations**: AI conversation data you choose to save
- **Settings**: Your preferences (theme, export options, etc.)
- **Folders**: Organization structure you create
- **Templates**: Custom export templates you create

### Local Storage Only

- No cloud synchronization
- No remote servers
- No external databases
- Data never leaves your device unless you explicitly export it

## Data Usage

The extension uses your locally stored data solely for:

1. **Display**: Showing your conversations in the extension UI
2. **Organization**: Managing folders and tags
3. **Search**: Finding conversations based on your search queries
4. **Export**: Creating downloadable files when you use the export feature
5. **Statistics**: Computing local statistics (token counts, conversation counts)

## Permissions Explained

The extension requests the following browser permissions:

### Required Permissions

1. **`storage`**
   - **Purpose**: Save your conversations and settings locally in your browser
   - **Data Access**: Only data created by this extension
   - **Note**: No data sent to external servers

2. **`activeTab`**
   - **Purpose**: Interact with the current tab when you use the extension
   - **Data Access**: Limited to when you actively use the extension
   - **Note**: Does not track or monitor your browsing

3. **`scripting`**
   - **Purpose**: Inject content scripts for ChatGPT integration features
   - **Data Access**: Only on pages where the extension is active
   - **Note**: Used for conversation capture features

4. **`downloads`**
   - **Purpose**: Allow you to export your conversations as files
   - **Data Access**: Only the data you explicitly choose to export
   - **Note**: Downloads stay on your device

5. **`host_permissions` (http://*/*, https://*/*)**
   - **Purpose**: Enable content script injection on websites
   - **Data Access**: Limited to extension functionality
   - **Note**: Required for ChatGPT integration features

## Third-Party Services

BetterGPT does not integrate with any third-party services, analytics platforms, or external APIs.

### ChatGPT Interaction

While BetterGPT can interact with ChatGPT (openai.com), please note:

- BetterGPT only observes conversations you have with ChatGPT
- BetterGPT does not send your conversations to any server other than ChatGPT's own servers (which you're already using)
- Your conversations with ChatGPT are subject to OpenAI's privacy policy
- BetterGPT simply saves a local copy for your convenience

## Data Security

Your data security is important to us:

- **Local Storage**: All data stored in browser's secure IndexedDB
- **No Transmission**: No data transmitted to external servers
- **Browser Protected**: Protected by your browser's security features
- **User Control**: You have full control over your data

## Data Retention

- **Local Control**: Data remains in your browser until you delete it
- **Manual Deletion**: You can delete conversations, folders, or all data at any time
- **Browser Clearing**: Clearing browser data will remove extension data
- **Uninstall**: Uninstalling the extension removes all associated data

## Data Export

You can export your data at any time in multiple formats:

- JSON (complete data export)
- Markdown (readable format)
- Plain text
- HTML
- PDF (if applicable)
- DOCX (if applicable)

Exported files are downloaded to your device and are under your control.

## Children's Privacy

BetterGPT does not collect any data from anyone, including children under 13. Since all data is stored locally, there are no specific age restrictions from a privacy perspective.

## Your Rights

You have complete control over your data:

1. **Access**: View all your data in the extension
2. **Export**: Download your data at any time
3. **Delete**: Remove individual items or all data
4. **Modify**: Edit conversations, folders, and settings
5. **Control**: Choose what to save and what to delete

## Changes to This Policy

We may update this privacy policy from time to time. We will notify users of any material changes by:

- Updating the "Last Updated" date
- Including change notes in release updates
- Posting an announcement if significant changes occur

## Open Source

BetterGPT is open source. You can:

- Review the source code on GitHub
- Verify that no data is sent to external servers
- Audit the extension's behavior
- Contribute to the project

**GitHub Repository**: https://github.com/vmanoilov/bettergpt

## Contact

If you have questions about this privacy policy or BetterGPT's data practices:

- **GitHub Issues**: https://github.com/vmanoilov/bettergpt/issues
- **Email**: support@bettergpt.dev (or use repository owner's email)

> **Note**: Update this email address before store submission

## Compliance

This extension complies with:

- Chrome Web Store Developer Program Policies
- Firefox Add-on Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

**Note**: Since no personal data is collected or processed, most data protection regulations do not apply, but we follow best practices anyway.

## Summary

**In simple terms:**
- ✅ Your data stays on your device
- ✅ No tracking or analytics
- ✅ No external servers
- ✅ Full control over your data
- ✅ Export anytime
- ✅ Delete anytime
- ✅ Open source for transparency

---

**Your privacy is paramount. BetterGPT is designed with privacy as a core principle.**
