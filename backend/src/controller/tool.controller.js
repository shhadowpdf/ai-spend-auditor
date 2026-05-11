import {pricingData} from "../data/pricingData.js";
import {runAudit} from "../utils/audit.engine.js";

export const getSupportedTools = (req, res) => {
    const filteredInfo = Object.keys(pricingData).map((tool)=> (
        {
            id: tool,
            name: pricingData[tool].name,
            plans: pricingData[tool].plans.map((plan)=> ({
                id: plan.id,
                name: plan.name,
                price: plan.price,
                requiresSeat: plan.requiresSeat,
                seats: plan?.seats
            }))
        }
    ));

    return res.status(200).json(filteredInfo)
}

export const getUserAudit = async (req,res) => {
    const userData = req.body;
    const result = await runAudit(userData);

    return res.json({data: result})
}
