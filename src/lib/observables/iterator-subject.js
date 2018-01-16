const Rx = require('rxjs/Rx')

/**
 * Respresents an Rx Subject that is tied to a provided iterator in it's constructor. Would
 * pull next item from iterator on "next". Otherwise it's just a normal Subject.
 * @extends Rx.Subject
 */
class IteratorSubject extends Rx.Subject {
  constructor(iterator) {
    super()
    this.iterator = iterator
  }

  next() {
    const item = this.iterator.next()

    if (item.done) {
      this.complete()
      return
    }

    super.next(item.value)
  }
}

module.exports = IteratorSubject
