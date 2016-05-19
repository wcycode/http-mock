import { Rule, Rules } from 'rules'

describe('Rule', function () {
  describe('IsMatch', function () {
    const path = '/example'
    const otherPath = '/ex'

    describe('constructor argument[0]: method', function () {
      it('get', function () {
        const rule = new Rule('get')
        expect(rule.isMatch({ method: 'get' })).toBeTruthy()
        expect(rule.isMatch({ method: 'post' })).toBeFalsy()
      })
      it('all', function () {
        const allRule = new Rule('all')
        expect(allRule.isMatch({ method: 'get' })).toBeTruthy()
        expect(allRule.isMatch({ method: 'post' })).toBeTruthy()
      })
    })

    describe('constructor argument[1]: pathname', function () {
      function check (r, skipSub) {
        expect(r.isMatch({
          method: 'get',
          location: { pathanme: path },
        })).toBeTruthy()

        // sub path
        !skipSub && expect(r.isMatch({
          method: 'get',
          location: { pathanme: `${path}/other` },
        })).toBeFalsy()

        // other path
        expect(r.isMatch({
          method: 'get',
          location: { pathanme: otherPath },
        })).toBeFalsy()
      }
      it('string', function () {
        // string
        const rule = new Rule('get', path)
        check(rule)
      })
      it('regexp', function () {
        // regexp
        const pathRegexp = /example/
        const rule2 = new Rule('get', pathRegexp)
        check(rule2, true)
        // sub path, matched
        expect(rule2.isMatch({
          method: 'get',
          location: { pathanme: `${path}/other` },
        })).toBeTruthy()
      })
      it('function', function () {
        // function
        function isUrlEqual (url) {
          return url === path
        }
        const rule3 = new Rule('get', isUrlEqual)
        check(rule3)
      })
    })

    describe('constructor argument[2]: params', function () {
      it('function', function () {
        // function
        function isParamsEqual (p) {
          return (p && p.key)
        }
        const rule = new Rule('get', null, isParamsEqual)
        expect(rule.isMatch({
          method: 'get',
          params: { key: '1' },
        })).toBeTruthy()
      })
      it('object', function () {
        // object
        const rule2 = new Rule('get', null, { key: '1', key2: '2' })
        expect(rule2.isMatch({
          method: 'get',
          params: { key: '1', key2: '2' },
        })).toBeTruthy()
        // contain, false
        expect(rule2.isMatch({
          method: 'get',
          params: { key: '1' },
        })).toBeFalsy()
      })
    })

    describe('constructor argument[3]: headers', function () {
      it('function', function () {
        // function
        function isHeadersEqual (p) {
          return (p && p.key)
        }
        const rule = new Rule('get', null, null, isHeadersEqual)
        expect(rule.isMatch({
          method: 'get',
          headers: { key: '1' },
        })).toBeTruthy()
      })

      it('object', function () {
        // object
        const rule2 = new Rule('get', null, null, { key: '1', key2: '2' })
        expect(rule2.isMatch({
          method: 'get',
          headers: { key: '1', key2: '2' },
        })).toBeTruthy()
        // contain, false
        expect(rule2.isMatch({
          method: 'get',
          headers: { key: '1' },
        })).toBeFalsy()
      })
    })
  })

  describe('GetResponse', function () {
    it('arguments is string', function () {
      const text = 'this is response'

      const rule = new Rule()
      rule.respond(200, text)
      const response = rule.getResponse()
      expect(response.status).toEqual('200')
      expect(response.text).toEqual(text)
    })

    it('arguments is function', function () {
      const rule = new Rule()
      rule.respond(300, function (config) {
        return `this path is ${config.location.pathname}`
      })
      const t = { location: { pathname: 'demo' } }
      const response = rule.getResponse(t)
      expect(response.status).toEqual('300')
      expect(response.text).toEqual('this path is demo')
    })
  })
})
describe('Rules', function () {
  const domain = 'http://example.com'
  const otherDomain = 'http://example2.com'

  const path = '/demo'

  describe('IsMatch', function () {
    it('constructor: can string', function () {
      const rules = new Rules(domain)
      expect(rules.isMatch({ loaction: { href: domain } })).toBeTruthy()
      expect(rules.isMatch({
        loaction: { href: `${domain}/demo` },
      })).toBeTruthy()

      expect(rules.isMatch({ loaction: { href: otherDomain } })).toBeFalsy()
    })
    xit('constructor: can host with some path', function () {
      const rules = new Rules(`${domain}/demo`)

      expect(rules.isMatch({
        loaction: { href: `${domain}/demo` },
      })).toBeTruthy()

      expect(rules.isMatch({
        loaction: { href: `${domain}/demo/other`,
      }})).toBeTruthy()

      expect(rules.isMatch({ loaction: { href: domain } })).toBeFalsy()
      expect(rules.isMatch({ loaction: { href: otherDomain } })).toBeFalsy()
    })
    it('constructor: can regexp', function () {
      const domainRegexp = /example\.com/
      const rules = new Rules(domainRegexp)
      expect(rules.isMatch({ loaction: { href: domain } })).toBeTruthy()
      expect(rules.isMatch({ loaction: { href: otherDomain } })).toBeTruthy()
      expect(rules.isMatch({ loaction: { href: 'http://ex.com' } })).toBeFalsy()
    })
    it('constructor: can function', function () {
      function isInDomain () {
        return false
      }
      const rules = new Rules(isInDomain)
      expect(rules.isMatch({ loaction: { href: domain } })).toBeFalsy()
      expect(rules.isMatch({ loaction: { href: otherDomain } })).toBeFalsy()
    })
    it('empty constructor must throw error', function () {
      expect(function () {
        return new Rules()
      }).toThrow()
    })
  })

  it('has method', function () {
    const rules = new Rules(domain)
    expect(rules.get).toEqual(jasmine.any(Function))
    expect(rules.post).toEqual(jasmine.any(Function))
    expect(rules['delete']).toEqual(jasmine.any(Function))
    expect(rules.put).toEqual(jasmine.any(Function))
  })

  it('findMatchRule', function () {
    const rules = new Rules(domain)
    const rule = rules.when('get', path)
    const r = rules.findMatchRule({
      method: 'get',
      location: {
        href: `${domain}${path}`,
        hostname: domain,
        pathname: path,
      },
    })
    expect(r).toBe(rule)
  })
})