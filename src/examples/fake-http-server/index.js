const express = require('express')
const app = express()
const PORT = 3456

// const { rnd } = require('../../lib/utils/rnd')

const sendFail = (res, number) => res.status(500).send(`💥 You got broken ${number}!`)

// const sendSometimesFailingResponse = (res, number) => {
//   const randomNumber = rnd(1, 3)
//
//   return randomNumber === 3 ? sendFail(res, number) : res.send(number)
// }

app.get('/numbers/:number', (req, res) => {
  const paramsNumber = parseInt(req.params.number, 10)
  if (paramsNumber === 0) {
    setTimeout(() => {
      console.info('sending response')
      res.send(paramsNumber.toString())
    }, 3000)
  } else if (paramsNumber === 4) {
    return sendFail(res, paramsNumber)
  } else {
    return res.send(paramsNumber >= 8 ? '' : paramsNumber.toString())
  }

  // setTimeout(() => {
  //   // sendFail(res, paramsNumber)
  //   if (paramsNumber % 4 === 0) {
  //    sendFail(res, paramsNumber)
  //  } else {
  //   res.send(paramsNumber >= 8 ? '' : paramsNumber.toString())
  //  }
  //
  // },Math.random() * 100 * Math.random() * 100)

  // return res.send(paramsNumber >= 20 ? '' : paramsNumber.toString())
  // return sendSometimesFailingResponse(res, paramsNumber)
  // return paramsNumber === '3' ? sendFail(res, paramsNumber) : res.send(paramsNumber)
})

const startHttpServer = () =>
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}`))

module.exports = {
  startHttpServer,
}
