"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")
const Plugin = require("../lib/plugin")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Used in a few tests below.
class Server {
  constructor() { }
  register(multicolour) { multicolour.set("server", this) }
  start(callback) { callback(); return this }
  stop(callback) { callback(); return this }
}

class Alt extends Plugin {}

tape("(Stupid tests) Multicolour initializes with base properties.", test => {
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Has members.
  test.equals(!!multicolour.request, true, "Has request function.")
  test.equals(!!multicolour.reply, true, "Has reply function.")
  test.equals(!!multicolour.use, true, "Has use function.")
  test.equals(!!multicolour.scan, true, "Has scan function.")
  test.equals(!!multicolour.start, true, "Has start function.")
  test.equals(!!multicolour.stop, true, "Has stop function.")

  // Replies with values.
  test.equals(!!multicolour.new("cli"), true, "Does reply with CLI member.")
  test.equals(!!multicolour.get("config"), true, "Does reply with config member.")
  test.equals(!!multicolour.request("new_uuid"), true, "Does reply with uuid.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour configures itself.", test => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Get the config object to check a few things were done right.
  const config = multicolour.get("config")

  test.notEqual(typeof multicolour.get("config"), "undefined", "Config should exist.")
  test.throws(() => Multicolour.new_from_config_file_path(), ReferenceError, "Should throw without path argument")
  test.throws(() => multicolour.reset_from_config_path(), TypeError, "Should throw without path argument")
  test.doesNotThrow(() => multicolour.reset_from_config_path(test_content_path + "/config.js"), TypeError, "Should not throw with path argument")
  test.notEqual(typeof config.get("content"), "undefined", "Config should have a content property.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can register plugins.", test => {
  test.plan(2)

  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Register a fake server generator.
  multicolour.scan().use(Server)

  test.doesNotThrow(() => multicolour.use(Alt), "Should not throw if plugin inherits from Multicolour.Plugin.")
  test.notEqual(typeof multicolour.get("server"), "undefined", "Should register server plugin.")

  // Reset multicolour.
  multicolour.reset()
})

tape("Multicolour scans for and finds blueprints.", test => {
  let multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Scan for content in the above defined content directory.
  multicolour.scan()

  test.notEqual(typeof multicolour.get("blueprints"), "undefined", "Blueprints should exist.")

  // Reset multicolour.
  multicolour.reset()

  multicolour = new Multicolour()

  // Scan for content when there's no config set.
  test.throws(() => multicolour.scan(), ReferenceError, "Throws error when no content path is set.")

  // Reset multicolour.
  multicolour.reset()

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can start and stop a server and throws expected errors.", test => {
  // Expect N tests.
  test.plan(6)

  // Create an instance of Multicolour.
  const multicolour = Multicolour
    .new_from_config_file_path(test_content_path + "config.js")
    .scan()

  // Check some sanity stuff.
  test.throws(() => multicolour.start(), ReferenceError, "Start throws a TypeError when no server configured without callback.")
  test.throws(() => multicolour.start(error => {throw error}), ReferenceError, "Start callback gets a ReferenceError when no server configured.")

  // Register the plugin.
  multicolour.use(Server)

  // Check when a server is configured properly that error is non-existent.
  multicolour.start(err => {
    test.equal(typeof err, "undefined", "Error not set when starting properly configured server plugin.")

    multicolour.stop(err => {
      // @TODO: Come back when this is fixed in the dependency.
      // FWIW: This is shit.
      if (err.message === "Cannot read property 'teardown' of undefined") {
        test.equal(err.message, "Cannot read property 'teardown' of undefined", "This 🐄 💩 error can be expected.")
      }
      else {
        test.equal(typeof err, "undefined", "Error not set when stopping properly configured server plugin.")
      }
    })
  })

  // Check the db adapter throws when improperly configured.
  test.throws(() => multicolour.start(), Error, "Improperly configured DB throws on start without callback.")

  const bad_multicolour = new Multicolour({
    db: {},
    content: test_content_path
  }).scan()

  test.throws(() => bad_multicolour.start(err => {throw err}), Error, "Improperly configured DB throws on start with callback.")

  // Reset multicolour.
  multicolour.reset()
})
