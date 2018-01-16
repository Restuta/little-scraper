const express = require('express')
const app = express()
const PORT = 31439

const sendFail = (res, number) => res.status(500).send(`💥 You got broken ${number}!`)

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
})

app.get('/numbers/all-good-after-6-empty/:number', (req, res) => {
  const paramsNumber = parseInt(req.params.number, 10)
  return res.send(paramsNumber >= 6 ? '' : paramsNumber.toString())
})

app.get('/numbers/first-delayed/:number', (req, res) => {
  const paramsNumber = parseInt(req.params.number, 10)
  if (paramsNumber === 0) {
    setTimeout(() => {
      res.send(paramsNumber.toString())
    }, 2000)
  } else if (paramsNumber === 4) {
    return sendFail(res, paramsNumber)
  } else {
    return res.send(paramsNumber >= 6 ? '' : paramsNumber.toString())
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

let server

const startHttpServer = () =>
  new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`)
      resolve(app)
    })
  })

const stopHttpServer = () =>
  new Promise((resolve, reject) => server.close(() => resolve()))

module.exports = {
  startHttpServer,
  stopHttpServer,
}
