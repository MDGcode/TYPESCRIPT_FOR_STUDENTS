enum HTTP_METHOD {
  GET = "GET",
  POST = "POST",
}

enum HTTP_STATUS {
  OK = 200,
  INTERNAL_SERVER_ERROR = 500,
}

interface ResponseResult {
  status: number;
}

interface ObserverHandlers {
  next: (value: RequestMock) => ResponseResult;
  error: (error: Error) => ResponseResult;
  complete: () => void;
}

interface UserMock {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

interface RequestMock {
  method: string;
  host: string;
  path: string;
  body?: UserMock;
  params: {
    id?: string;
  };
}

class Observer {
  private handlers: ObserverHandlers;
  private isUnsubscribed: boolean;
  _unsubscribe?: () => void;
  constructor(handlers: ObserverHandlers) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: RequestMock) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  private _subscribe: (observer: Observer) => () => void;
  constructor(subscribe: (observer: Observer) => () => void) {
    this._subscribe = subscribe;
  }

  static from(values: Array<RequestMock>) {
    return new Observable((observer: Observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: ObserverHandlers) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: UserMock = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: Array<RequestMock> = [
  {
    method: HTTP_METHOD.POST,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HTTP_METHOD.GET,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (request: RequestMock) => {
  // handling of request
  return { status: HTTP_STATUS.OK };
};
const handleError = (error: Error) => {
  // handling of error
  return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
};

const handleComplete = () => console.log("complete");

const requests = Observable.from(requestsMock);

const subscription = requests.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
