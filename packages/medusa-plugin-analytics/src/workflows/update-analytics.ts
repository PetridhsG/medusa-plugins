/* Workflow that updates pre-aggregated analytics for a single completed order. */
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateAnalyticsStep } from "./steps/update-analytics"

type Input = { order_id: string }

const updateAnalyticsWorkflow = createWorkflow(
  "update-analytics",
  function (input: Input) {
    const result = updateAnalyticsStep(input)
    return new WorkflowResponse(result)
  }
)

export default updateAnalyticsWorkflow
