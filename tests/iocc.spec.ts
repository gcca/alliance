//import { alcore } from '../alliance/iocc';

//export namespace alliance {
//export namespace core {
interface Constructable {
  new (...args: any[]): any;
  __mro__?: any;
}

export function Component(...options: any) {
  return function (constructable: Constructable, otro?: any) {
    constructable.__mro__ = options;
  };
}

export class Container {
  private MRO: Map<string, Constructable>;

  constructor() {
    this.MRO = new Map<string, Constructable>();
  }

  Register<T>(sign: string, component: new () => T): void {
    this.MRO.set(sign, component);
  }

  Construct<T>(component: new (...args: any[]) => T): T {
    let p = this.MRO.get("Producer");
    if (p) {
      return new component(new p());
    }
    throw Error("No dep");
  }
}
//}
//}

describe("DependencyInjection", () => {
  describe("Container", () => {
    it("should register single components", () => {
      interface Producer {
        Notify(): void;
      }

      class ConcreteProducer implements Producer {
        Notify(): void {
          console.log("OLA");
        }
      }

      @Component("Producer")
      class Controller {
        constructor(private producer: Producer) {}

        Notify(): void {
          this.producer.Notify();
        }
      }

      let container = new Container();
      container.Register<Producer>("Producer", ConcreteProducer);

      let controller = container.Construct(Controller);
      //let controller = new Controller(new ConcreteProducer());

      controller.Notify();
    });
  });
});
