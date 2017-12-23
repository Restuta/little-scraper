const express = require('express')
const app = express()
const PORT = 3456

const { rnd } = require('../../lib/utils/rnd')

const sendFail = (res, number) =>
  res.status(500).send(`💥 You got broken ${number}!`)

const sendSometimesFailingResponse = (res, number) => {
  const randomNumber = rnd(1, 3)

  return randomNumber === 3 ? sendFail(res, number) : res.send(number)
}

app.get('/numbers/:number', (req, res) => {
  const paramsNumber = req.params.number
  return res.send(paramsNumber)
  // return sendSometimesFailingResponse(res, paramsNumber)
  // return paramsNumber === '3' ? sendFail(res, paramsNumber) : res.send(paramsNumber)
})

const startHttpServer = () =>
  app.listen(PORT, () => console.log(`Example app listening on port PORT!`))

module.exports = {
  startHttpServer,
}
