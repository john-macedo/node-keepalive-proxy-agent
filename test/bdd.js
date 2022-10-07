/* eslint-env node, mocha */
require('should')
const testServer = require('../testserver')
const http = require('http')
const https = require('https')
const net = require('net')
const MyAgent = require('..')

describe('proxy agent', function () {
  before(function () {
    return testServer.start()
  })
  beforeEach(function () {
    delete process.env.https_proxy
    delete process.env.HTTPS_PROXY
  })
  after(function () {
    return testServer.stop()
  })
  describe('agent', function () {
    it('should default keepAlive', function (cb) {
      const agent = new MyAgent()
      // noinspection JSUnresolvedVariable
      agent.options.keepAlive.should.equal(true)
      cb()
    })
    it('should not overwrite keepAlive', function (cb) {
      const agent = new MyAgent({ keepAlive: false })
      // noinspection JSUnresolvedVariable
      agent.options.keepAlive.should.equal(false)
      cb()
    })
  })
  describe('when using process.env', function () {
    it('succeeds on env https_proxy', function (cb) {
      process.env.https_proxy = 'http://localhost:3128'
      const agent = new MyAgent()
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('succeeds on env HTTPS_PROXY', function (cb) {
      process.env.HTTPS_PROXY = 'http://localhost:3128'
      const agent = new MyAgent()
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('also work with no proxy setting', function (cb) {
      const agent = new MyAgent()
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
  })
  describe('when using no authentication', function () {
    it('succeeds on good request', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3128 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('throws error on bad target port', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3128 } })
      const options = { hostname: 'localhost', port: 8445, agent: agent, rejectUnauthorized: false }

      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 500')
        cb()
      })
    })

    it('automatically uses port 443 ', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3128 } })
      const options = { hostname: 'localhost', agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        e.message.should.be.oneOf('HTTP/1.1 500', 'socket hang up')
        cb()
      })
    })
    it('throws error on bad proxy port', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        // noinspection SpellCheckingInspection
        e.message.should.be.equal('connect ECONNREFUSED 127.0.0.1:3130')
        cb()
      })
    })
  })
  describe('when using authentication', function () {
    it('succeeds on good auth', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3129, auth: 'bob:alice' } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('throws error on bad auth', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3129, auth: 'bo2b:alice' } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }

      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 407')
        cb()
      })
    })
    it('allors host instead of hostname', function (cb) {
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3129, auth: 'bo2b:alice' } })
      const options = { host: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }

      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 407')
        cb()
      })
    })
    it('allows host+port instead of hostname', function (cb) {
      const agent = new MyAgent({ proxy: { host: 'localhost', port: 3129, auth: 'bo2b:alice' } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }

      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 407')
        cb()
      })
    })
    it('allows host instead of hostname', function (cb) {
      const agent = new MyAgent({ proxy: { host: 'localhost', port: 3129, auth: 'bo2b:alice' } })
      const options = { hostname: 'localhost', agent: agent, rejectUnauthorized: false }

      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 407')
        cb()
      })
    })
    it('allows uri string in options', function (cb) {
      const agent = new MyAgent("http://localhost:3128/")
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
    it('allows options without proxy: key', function (cb) {
      const agent = new MyAgent({  hostname: 'localhost', port: 3128  })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          cb()
        })
      })
    })
  })

  describe('when receiving chunked CONNECT response', function () {
    let pServer

    beforeEach(() => {
      pServer = http.createServer((req, res) => {
        res.end()
      })
    })

    afterEach(() => {
      pServer.close()
    })

    function configureAndStartProxy (connectResponses, cb,dropSocket) {
      pServer.on('connect', (request, socket, head) => {
        const targetHost = request.url.split(':')
        const conn = net.connect({
          port: +targetHost[1],
          host: targetHost[0],
          allowHalfOpen: true
        }, function () {
          conn.on('finish', () => {
            socket.destroy()
          })
          socket.on('close', () => {
            // Client socket closed, closing tunnel
            conn.end()
          })

          function writeNextResponse (connectResponses) {
            const response = connectResponses.shift()
            socket.write(response, 'UTF-8', function () {
              if (connectResponses.length > 0) {
                setTimeout(writeNextResponse, 100, connectResponses)
              } else if (dropSocket) {
                socket.end()
                conn.end()
              } else {
                conn.write(head)
                conn.pipe(socket)
                socket.pipe(conn)
              }
            })
          }
          writeNextResponse(connectResponses)
        })

        conn.on('error', function (err) {
          filterSocketConnReset(err)
        })
        socket.on('error', function (err) {
          filterSocketConnReset(err)
        })

        // Since node 0.9.9, ECONNRESET on sockets are no longer hidden
        function filterSocketConnReset (err) {
          if (err.code === 'ECONNRESET') {
            // Ignore, we get these when the socket is closing
          } else {
            cb(err)
          }
        }
      })
      pServer.listen(3130)
    }

    it('succeeds on good response', function (cb) {
      configureAndStartProxy(['HTTP/1.1 200 OK\r\n\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          agent.destroy()
          cb()
        })
      })
    })

    it('succeeds on two part response', function (cb) {
      configureAndStartProxy(['HTTP/1.1 200 OK\r\n', '\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          agent.destroy()
          cb()
        })
      })
    })

    it('succeeds on three part response', function (cb) {
      configureAndStartProxy(['HTTP/1.1 2', '00 OK', '\r\n\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      let data = 'BAD'
      https.get(options, (resp) => {
        resp.statusCode.should.equal(200)
        resp.on('data', d => { data = d })
        resp.on('end', () => {
          data.toString().should.equal(':/:')
          agent.destroy()
          cb()
        })
      })
    })

    it('throws on three part 401 response', function (cb) {
      configureAndStartProxy(['HTTP/1.1 4', '01 Not Authorized', '\r\n\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/1.1 401')
        cb()
      })
    })

    it('throws on three part invalid response', function (cb) {
      configureAndStartProxy(['HTTP/0.0 4', '01 Not Authorized', '\r\n\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/0.0 401 Not Authorized')
        cb()
      })
    })
    it('throws error.code ERR_HTTP_PROXY_CONNECT on invalid response', function (cb) {
      configureAndStartProxy(['HTTP/0.0 401 Not Authorized\r\n\r\n'], null, null, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        e.message.should.be.equal('HTTP/0.0 401 Not Authorized')
        e.code.should.be.equal('ERR_HTTP_PROXY_CONNECT')
        cb()
      })
    })
    it('throws error.code ERR_HTTP_PROXY_CONNECT on socket close before connect', function (cb) {
      configureAndStartProxy(['HTTP'], null, true, cb)
      const agent = new MyAgent({ proxy: { hostname: 'localhost', port: 3130 } })
      const options = { hostname: 'localhost', port: 8443, agent: agent, rejectUnauthorized: false }
      https.get(options).on('error', e => {
        e.message.should.be.equal("'end'")
        e.code.should.be.equal('ERR_HTTP_PROXY_CONNECT')
        cb()
      })
    })
  })
})
