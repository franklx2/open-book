var serverlessSDK = require('./serverless_sdk/index.js')
serverlessSDK = new serverlessSDK({
orgId: 'franklx2',
applicationName: 'open-book',
appUid: 'LD3D4MtcZ9WxYXw8q2',
orgUid: 'gK7tkm88yzR6CNRhM8',
deploymentUid: '5b33d890-567f-4cf7-8ec6-ae9274a1e4b4',
serviceName: 'open-book',
shouldLogMeta: true,
stageName: 'dev',
pluginVersion: '3.4.1'})
const handlerWrapperArgs = { functionName: 'open-book-dev-create', timeout: 28}
try {
  const userHandler = require('./handler.js')
  module.exports.handler = serverlessSDK.handler(userHandler.create, handlerWrapperArgs)
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs)
}
