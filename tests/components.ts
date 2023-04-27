import { Component, Constructable } from "../alliance/runtime";

interface Producer {
  Notify(): void;
}

class ConcreteProducer implements Producer {
  Notify(): void {
    console.log("OLA");
  }
}

@Component({})
class Controller {
  constructor(private producer: Producer) {}

  Notify(): void {
    this.producer.Notify();
  }
}

let controller = new Controller(new ConcreteProducer());
controller.Notify();
