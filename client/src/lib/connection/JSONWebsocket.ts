import type {
  SocketRequestResponse,
  SocketServerErrorResponse,
} from 'do-verse';

export class JSONWebsocket<SRR extends SocketRequestResponse<any, any>, SM> {
  private url: string;
  private webSocket: WebSocket | undefined;
  private counter: number = 0;
  private promises: {
    [id: number]: {
      resolve: (
        response: SRR['response'] | PromiseLike<SRR['response']>,
      ) => void;
      reject: (error: any) => void;
    };
  } = {};
  private _initialized: boolean = false;
  private _queue: (() => void)[] = [];
  public onMessage: ((SM) => void) | undefined;
  public onClose: ((event: CloseEvent) => void) | undefined;
  constructor(url?: string) {
    let urlObject: URL;
    if (!url) {
      urlObject = window.location as unknown as URL;
    } else {
      urlObject = new URL(url);
    }
    const protocol = urlObject.protocol === 'http:' ? 'ws:' : 'wss:';
    const hostname = urlObject.hostname;
    let port = urlObject.port;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      port = `8787`;
    } else {
      // TODO sub domain ws ?
    }

    url = `${protocol}//${hostname}${
      port === '80' || port === '443' ? '' : `:${port}`
    }/ws`;

    this.url = url;
  }

  get readyState():
    | 'UNINITIALIZED'
    | 'CLOSED'
    | 'CLOSING'
    | 'CONNECTING'
    | 'OPEN'
    | 'UNKNOWN' {
    if (!this.webSocket) {
      return 'UNINITIALIZED';
    } else {
      switch (this.webSocket.readyState) {
        case WebSocket.CLOSED:
          return 'CLOSED';
        case WebSocket.CLOSING:
          return 'CLOSING';
        case WebSocket.CONNECTING:
          return 'CONNECTING';
        case WebSocket.OPEN:
          return 'OPEN';
      }
    }
    return 'UNKNOWN';
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const webSocket = new WebSocket(this.url);
      this.webSocket = webSocket;
      webSocket.onopen = (event) => {
        this._initialized = true;
        resolve();
        while (this._queue.length > 0) {
          const func = this._queue.shift();
          if (func) {
            func();
          }
        }
        webSocket.onmessage = (event) => {
          const json: SRR['response'] & { id?: number } = JSON.parse(
            event.data,
          );
          if (json.id) {
            const promise = this.promises[json.id];
            delete this.promises[json.id];
            if (json.type == 'error') {
              promise.reject(json);
            } else {
              promise.resolve(json);
            }
          } else if (this.onMessage) {
            this.onMessage(json);
          }
        };
      };
      webSocket.onerror = (error) => {
        if (!this._initialized) {
          this.webSocket = undefined;
        }
        console.error(error, error.toString());
        reject(error);
      };
      webSocket.onclose = (event: CloseEvent) => {
        console.log(`closed`, event);
        if (this.onClose) {
          this.onClose(event);
        }
      };
    });
  }

  request<Request extends SRR['request'], Response extends SRR['response']>(
    json: Request,
  ): Promise<Response> {
    const webSocket = this.webSocket;
    if (!webSocket) {
      return Promise.reject(`websocket failed to initialize`);
    }

    const id = ++this.counter;
    const promise = new Promise<Response>((resolve, reject) => {
      if (!this._initialized) {
        this._queue.push(() => {
          webSocket.send(JSON.stringify({ ...json, id }));
        });
      } else {
        webSocket.send(JSON.stringify({ ...json, id }));
      }
      this.promises[id] = { resolve, reject };
    });

    return promise as Promise<Response>;
  }

  send<Request extends SM>(json: Request) {
    const webSocket = this.webSocket;
    if (!webSocket) {
      return Promise.reject(`websocket not initialized`);
    }
    if (
      webSocket.readyState === WebSocket.CLOSING ||
      webSocket.readyState === WebSocket.CLOSED
    ) {
      console.error(`websocket is closing/closed (${webSocket.readyState})`);
      // TODO reconnect
      return;
    } else if (webSocket.readyState === WebSocket.CONNECTING) {
      console.error(`websocket is connecting...`);
      // TODO queue
      return;
    } else if (webSocket.readyState === WebSocket.OPEN) {
    } else {
      console.error(`websocket in unknown state: ${webSocket.readyState}`);
    }

    try {
      webSocket.send(JSON.stringify(json));
    } catch (err) {
      console.error(`cannot send`, err);
    }
  }

  close() {
    this.webSocket?.close();
    this._initialized = true;
    // TODO closed state ?
  }
}
