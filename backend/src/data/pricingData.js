export const pricingData = {
    cursor: {
        name: 'Cursor',
        plans: [
            {
                id: "hobby",
                name: "Hobby",
                price: 0,
                bestCase: ["coding"]
            },
            {
                id: "pro",
                name: "Pro",
                price: 20,
                bestCase: ["coding", "writing"]
            },
            {
                id: "pro-plus",
                name: "Pro+",
                price: 60,
                bestCase: ["coding", "data", "mixed"]
            },
            {
                id: "ultra",
                name: "Ultra",
                price: 200,
                bestCase: ["coding", "research", "data"]
            },
            {
                id: "teams",
                name: "Teams",
                price: 40,
                requiresSeat: true,
                bestCase: ["coding", "mixed"]
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: "based on usage",
                requiresSeat: true,
                bestCase: ["mixed", "data", "research"]
            }
        ]
    },
    githubCopilot: {
        name: 'GitHub Copilot',
        plans: [
            {
                id: "free",
                name: "Free",
                price: 0,
                bestCase: ["writing", "research"]
            },
            {
                id: "pro",
                name: "Pro",
                price: 10,
                bestCase: ["coding", "writing"]
            },
            {
                id: "pro-plus",
                name: "Pro+",
                price: 39,
                bestCase: ["coding", "data", "mixed"]
            },
            {
                id: "business",
                name: "Business",
                price: 19,
                requiresSeat: true,
                bestCase: ["mixed", "writing", "data"]
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: 39,
                requiresSeat: true,
                bestCase: ["mixed", "data", "research"]
            }
        ]
    },
    claude: {
        name: "Claude",
        plans: [
            {
                id: "free",
                name: "Free",
                price: 0,
                bestCase: ["writing", "research"]
            },
            {
                id: "pro",
                name: "Pro",
                price: 17,
                bestCase: ["coding", "writing"]
            },
            {
                id: "max",
                name: "Max",
                price: 100,
                bestCase: ["research", "data", "mixed"]
            },
            {
                id: "team-standard",
                name: "Team-Standard",
                price: 20,
                seats: {
                    min: 5,
                    max: 150
                },
                requiresSeat: true,
                bestCase: ["research", "data"]
            },
            {
                id: "team-premium",
                name: "Team-Premium",
                price: 100,
                seats: {
                    min: 5,
                    max: 150
                },
                requiresSeat: true,
                bestCase: ["mixed", "writing", "data"]
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: "based on usage",
                requiresSeat: true,
                seats: {
                    min: 20
                },
                bestCase: ["mixed", "data", "research"]
            }
        ]
    },
    chatGPT: {
        name: "ChatGPT",
        plans: [
            {
                id: "free",
                name: "Free",
                price: 0,
                bestCase: ["writing", "research"]
            },
            {
                id: "go",
                name: "ChatGPT Go",
                price: 8,
                bestCase: ["writing", "research"]
            },
            {
                id: "plus",
                name: "ChatGPT Plus",
                price: 20,
                bestCase: ["coding", "research"]
            },
            {
                id: "pro",
                name: "ChatGPT Pro",
                price: 100,
                bestCase: ["coding", "writing"]
            },
            {
                id: "business",
                name: "ChatGPT Business",
                price: 20,
                requiresSeat: true,
                bestCase: ["mixed", "writing", "data"]
            }
        ]
    },
    anthropicAPI: {
        name: "Anthropic API",
        plans: [
            {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",

                price: {
                    inputPerMTok: 5,
                    outputPerMTok: 25,
                },

                bestCase: ["research", "coding"]
            },

            {
                id: "claude-opus-4.6",
                name: "Claude Opus 4.6",

                price: {
                    inputPerMTok: 5,
                    outputPerMTok: 25,
                },

                bestCase: ["research", "coding"]
            },

            {
                id: "claude-opus-4.5",
                name: "Claude Opus 4.5",

                price: {
                    inputPerMTok: 5,
                    outputPerMTok: 25,
                },

                bestCase: ["research", "coding"]
            },

            {
                id: "claude-opus-4.1",
                name: "Claude Opus 4.1",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                bestCase: ["research", "writing"]
            },

            {
                id: "claude-opus-4",
                name: "Claude Opus 4",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                bestCase: ["research", "writing"]
            },

            {
                id: "claude-sonnet-4.6",
                name: "Claude Sonnet 4.6",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                bestCase: ["research", "mixed"]
            },

            {
                id: "claude-sonnet-4.5",
                name: "Claude Sonnet 4.5",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                bestCase: ["research", "mixed"]
            },

            {
                id: "claude-sonnet-4",
                name: "Claude Sonnet 4",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                bestCase: ["research", "mixed"]
            },

            {
                id: "claude-sonnet-3.7",
                name: "Claude Sonnet 3.7",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                bestCase: ["research", "mixed"]
            },

            {
                id: "claude-haiku-4.5",
                name: "Claude Haiku 4.5",

                price: {
                    inputPerMTok: 1,
                    outputPerMTok: 5,
                },

                bestCase: ["writing", "data"]
            },

            {
                id: "claude-haiku-3.5",
                name: "Claude Haiku 3.5",

                price: {
                    inputPerMTok: 0.8,
                    outputPerMTok: 4,
                },

                bestCase: ["writing", "data"]
            },

            {
                id: "claude-opus-3",
                name: "Claude Opus 3",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                bestCase: ["research", "writing"]
            },

            {
                id: "claude-haiku-3",
                name: "Claude Haiku 3",

                price: {
                    inputPerMTok: 0.25,
                    outputPerMTok: 1.25,
                },

                bestCase: ["writing", "research"]
            },
        ]
    },
    openAIAPI: {
        name: "OpenAI API",
        plans: [
            {
                id: "gpt-5.5",
                name: "GPT-5.5",

                price: {
                    inputPerMTok: 2.5,
                    outputPerMTok: 15,
                },

                bestCase: ["coding", "research"]
            },

            {
                id: "gpt-5.4",
                name: "GPT-5.4",

                price: {
                    inputPerMTok: 1.25,
                    outputPerMTok: 7.5,
                },

                bestCase: ["research", "mixed"]
            },

            {
                id: "gpt-5.4-mini",
                name: "GPT-5.4 mini",

                price: {
                    inputPerMTok: 0.375,
                    outputPerMTok: 2.25,
                },

                bestCase: ["data", "research"]
            },
        ]
    },
    gemini: {
        name: "Gemini",
        plans: [
            {
                id: "free",
                name: "Free",

                price: 0,

                bestCase: ["writing", "research"]
            },

            {
                id: "google-ai-plus",
                name: "Google AI Plus",

                price: 7.99,

                bestCase: ["writing", "mixed"]
            },

            {
                id: "google-ai-pro",
                name: "Google AI Pro",

                price: 19.99,

                bestCase: ["mixed", "data"]
            },

            {
                id: "google-ai-ultra",
                name: "Google AI Ultra",

                price: 249.99,

                bestCase: ["coding", "research"]
            },
        ]
    },
    windsurf:{
        name: "Windsurf",
        plans: [
            {
                id: "free",
                name: "Free",
                
                price: 0,
                bestCase: ["writing", "research"]
            },
            {
                id: "pro",
                name: "Pro",
                price: 20,
                bestCase: ["coding", "writing"]
            },
            {
                id: "max",
                name: "Max",
                price: 200,
                bestCase: ["research", "data", "mixed"]
            },
            {
                id: "team",
                name: "Team",
                price: 40,
                requiresSeat: true,
                bestCase: ["coding", "data"]
            }
        ]
    }
}
