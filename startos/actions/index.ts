import { sdk } from '../sdk'
import { editConfig } from './editConfig'
import { previewPolicies } from './previewPolicies'

export const actions = sdk.Actions.of()
  .addAction(editConfig)
  .addAction(previewPolicies)
