export const pricingData = {
    cursor: {
        name: 'Cursor',
        plans: [
            {
                id: "hobby",
                name: "Hobby",
                price: 0,
                audit: {}
            },
            {
                id: "pro",
                name: "Pro",
                price: 20,
                audit: {}
            },
            {
                id: "pro-plus",
                name: "Pro+",
                price: 60,
                audit: {}
            },
            {
                id: "ultra",
                name: "Ultra",
                price: 200,
                audit: {}
            },
            {
                id: "teams",
                name: "Teams",
                price: 40,
                requiresSeat: true,
                audit: {}
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: "based on usage",
                requiresSeat: true,
                audit: {}
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
                audit: {}
            },
            {
                id: "pro",
                name: "Pro",
                price: 10,
                audit: {}
            },
            {
                id: "pro-plus",
                name: "Pro+",
                price: 39,
                audit: {}
            },
            {
                id: "business",
                name: "Business",
                price: 19,
                requiresSeat: true,
                audit: {}
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: 39,
                requiresSeat: true,
                audit: {}
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
                audit: {}
            },
            {
                id: "pro",
                name: "Pro",
                price: 17,
                audit: {}
            },
            {
                id: "max",
                name: "Max",
                price: 100,
                audit: {}
            },
            {
                id: "team",
                name: "Team-Standard",
                price: 20,
                seats: {
                    min: 5,
                    max: 150
                },
                requiresSeat: true,
                audit: {}
            },
            {
                id: "team",
                name: "Team-Premium",
                price: 100,
                seats: {
                    min: 5,
                    max: 150
                },
                requiresSeat: true,
                audit: {}
            },
            {
                id: "enterprise",
                name: "Enterprise",
                price: "based on usage",
                requiresSeat: true,
                seats: {
                    min: 20
                },
                audit: {}
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
                audit: {}
            },
            {
                id: "go",
                name: "ChatGPT Go",
                price: 8,
                audit: {}
            },
            {
                id: "plus",
                name: "ChatGPT Plus",
                price: 20,
                audit: {}
            },
            {
                id: "pro",
                name: "ChatGPT Pro",
                price: 100,
                audit: {}
            },
            {
                id: "business",
                name: "ChatGPT Business",
                price: 20,
                requiresSeat: true,
                audit: {}
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

                audit: {},
            },

            {
                id: "claude-opus-4.6",
                name: "Claude Opus 4.6",

                price: {
                    inputPerMTok: 5,
                    outputPerMTok: 25,
                },

                audit: {},
            },

            {
                id: "claude-opus-4.5",
                name: "Claude Opus 4.5",

                price: {
                    inputPerMTok: 5,
                    outputPerMTok: 25,
                },

                audit: {},
            },

            {
                id: "claude-opus-4.1",
                name: "Claude Opus 4.1",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                audit: {},
            },

            {
                id: "claude-opus-4",
                name: "Claude Opus 4",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                audit: {},
            },

            {
                id: "claude-sonnet-4.6",
                name: "Claude Sonnet 4.6",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                audit: {},
            },

            {
                id: "claude-sonnet-4.5",
                name: "Claude Sonnet 4.5",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                audit: {},
            },

            {
                id: "claude-sonnet-4",
                name: "Claude Sonnet 4",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                audit: {},
            },

            {
                id: "claude-sonnet-3.7",
                name: "Claude Sonnet 3.7",

                price: {
                    inputPerMTok: 3,
                    outputPerMTok: 15,
                },

                audit: {},
            },

            {
                id: "claude-haiku-4.5",
                name: "Claude Haiku 4.5",

                price: {
                    inputPerMTok: 1,
                    outputPerMTok: 5,
                },

                audit: {},
            },

            {
                id: "claude-haiku-3.5",
                name: "Claude Haiku 3.5",

                price: {
                    inputPerMTok: 0.8,
                    outputPerMTok: 4,
                },

                audit: {},
            },

            {
                id: "claude-opus-3",
                name: "Claude Opus 3",

                price: {
                    inputPerMTok: 15,
                    outputPerMTok: 75,
                },

                audit: {},
            },

            {
                id: "claude-haiku-3",
                name: "Claude Haiku 3",

                price: {
                    inputPerMTok: 0.25,
                    outputPerMTok: 1.25,
                },

                audit: {},
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

                audit: {},
            },

            {
                id: "gpt-5.4",
                name: "GPT-5.4",

                price: {
                    inputPerMTok: 1.25,
                    outputPerMTok: 7.5,
                },

                audit: {},
            },

            {
                id: "gpt-5.4-mini",
                name: "GPT-5.4 mini",

                price: {
                    inputPerMTok: 0.375,
                    outputPerMTok: 2.25,
                },

                audit: {},
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

                audit: {},
            },

            {
                id: "google-ai-plus",
                name: "Google AI Plus",

                price: 7.99,

                audit: {},
            },

            {
                id: "google-ai-pro",
                name: "Google AI Pro",

                price: 19.99,

                audit: {},
            },

            {
                id: "google-ai-ultra",
                name: "Google AI Ultra",

                price: 249.99,

                audit: {},
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
                audit: {}
            },
            {
                id: "pro",
                name: "Pro",
                price: 20,
                audit: {}
            },
            {
                id: "max",
                name: "Max",
                price: 200,
                audit: {}
            },
            {
                id: "team",
                name: "Team",
                price: 40,
                requiresSeat: true,
                audit: {}
            }
        ]
    }
}