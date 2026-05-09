import {pricingData} from "../data/pricingData.js";

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


