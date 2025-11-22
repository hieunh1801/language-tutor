
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const BACKUP_FILE_NAME = 'ai_tutor_backup.json';

export interface GoogleUserProfile {
  name: string;
  picture: string;
  id: string;
}

export class GoogleDriveService {
  private tokenClient: any;
  private accessToken: string | null = null;
  private clientId: string = '';
  private tokenExpiration: number = 0;

  constructor() {}

  public init(clientId: string) {
    this.clientId = clientId;
    if ((window as any).google && !this.tokenClient) {
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    this.accessToken = tokenResponse.access_token;
                    // Auto-expire estimate (1 hour)
                    this.tokenExpiration = Date.now() + (tokenResponse.expires_in || 3599) * 1000;
                }
            },
        });
    }
  }

  public get isTokenValid(): boolean {
      return !!this.accessToken && Date.now() < this.tokenExpiration;
  }

  public async login(): Promise<string> {
      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
             // Try initializing if client ID is present
             if(this.clientId && (window as any).google) {
                 this.init(this.clientId);
             } else {
                 reject(new Error("Google Identity Service chưa sẵn sàng. Hãy kiểm tra Client ID trong cài đặt."));
                 return;
             }
        }

        // Override callback for the login flow
        this.tokenClient.callback = (resp: any) => {
            if (resp.error) {
                reject(resp);
            } else {
                this.accessToken = resp.access_token;
                this.tokenExpiration = Date.now() + (resp.expires_in || 3599) * 1000;
                resolve(resp.access_token);
            }
        };

        // Trigger the popup
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
  }

  public async getUserInfo(): Promise<GoogleUserProfile> {
      if (!this.accessToken) throw new Error("Chưa đăng nhập");

      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      if (!response.ok) throw new Error("Không thể lấy thông tin người dùng");
      return await response.json();
  }

  public logout() {
      this.accessToken = null;
      this.tokenExpiration = 0;
      if ((window as any).google) {
          (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {});
      }
  }

  // --- Drive Operations ---

  private async findBackupFile(): Promise<string | null> {
      if (!this.accessToken) throw new Error("No access token");

      const query = `name = '${BACKUP_FILE_NAME}' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

      const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      const data = await response.json();
      if (data.files && data.files.length > 0) {
          return data.files[0].id;
      }
      return null;
  }

  public async uploadBackup(data: object): Promise<void> {
      if (!this.isTokenValid) await this.login();
      
      const existingFileId = await this.findBackupFile();
      
      const fileContent = JSON.stringify(data, null, 2);
      const file = new Blob([fileContent], { type: 'application/json' });
      const metadata = {
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (existingFileId) {
          url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
          method = 'PATCH';
      }

      const response = await fetch(url, {
          method: method,
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
          body: form
      });

      if (!response.ok) {
          throw new Error("Upload failed");
      }
  }

  public async downloadBackup(): Promise<any> {
      if (!this.isTokenValid) await this.login();
      
      const fileId = await this.findBackupFile();
      
      if (!fileId) {
          throw new Error("Không tìm thấy file backup nào trên Google Drive của bạn.");
      }

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (!response.ok) {
          throw new Error("Download failed");
      }

      return await response.json();
  }
}
