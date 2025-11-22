
// Using dpaste.com via CORS Proxy to avoid browser restrictions and ensure reliability
const PROXY_URL = 'https://corsproxy.io/?';
const API_URL = 'https://dpaste.com/api/';

export class ZeroService {
  
  /**
   * Uploads the backup data to dpaste.com
   * Returns the URL of the uploaded snippet.
   */
  public async upload(data: object): Promise<string> {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        
        const formData = new URLSearchParams();
        formData.append('content', jsonString);
        formData.append('syntax', 'json');
        formData.append('expiry_days', '90'); // Keep for 90 days

        // POST via Proxy
        const targetUrl = PROXY_URL + encodeURIComponent(API_URL);
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        // dpaste returns the URL in plain text
        let url = await response.text();
        url = url.trim();
        
        if (!url.startsWith('http')) {
             throw new Error("Cloud did not return a valid URL.");
        }

        return url;
    } catch (error) {
        console.error("Cloud Upload Error:", error);
        throw error;
    }
  }

  /**
   * Downloads the backup data from a provided URL
   */
  public async download(url: string): Promise<any> {
      try {
          let targetUrl = url.trim();
          
          // Basic validation
          if (!targetUrl.startsWith('http')) {
              throw new Error("URL không hợp lệ.");
          }

          // dpaste URLs need .txt for raw content if not already present
          if (targetUrl.includes('dpaste.com') && !targetUrl.endsWith('.txt')) {
              // Remove trailing slash if exists
              if (targetUrl.endsWith('/')) targetUrl = targetUrl.slice(0, -1);
              targetUrl += '.txt';
          }

          // Use proxy for download as well to avoid CORS
          const proxiedUrl = PROXY_URL + encodeURIComponent(targetUrl);

          const response = await fetch(proxiedUrl);

          if (!response.ok) {
              throw new Error("Không thể tải file. Link có thể đã hết hạn hoặc không tồn tại.");
          }
          return await response.json();
      } catch (error) {
          console.error("Cloud Download Error:", error);
          throw error;
      }
  }
}
