// Tool definitions exposed to Claude. Each phase gets a small, focused tool set
// plus a terminal `submit_*` tool whose input schema IS the structured artifact
// we want back — a robust, version-agnostic way to get typed output (and it
// keeps the agent's reasoning inspectable in the tool-call trace).

export const getClimateTool = {
  name: 'get_climate',
  description: "Look up a destination's historical climate normals for a given month (1-12).",
  input_schema: {
    type: 'object',
    properties: {
      destinationId: { type: 'string', description: 'A destination id from the candidate list.' },
      month: { type: 'integer', minimum: 1, maximum: 12 },
    },
    required: ['destinationId', 'month'],
  },
};

export const submitDestinationsTool = {
  name: 'submit_destinations',
  description: 'Submit the final destination recommendations. Call this once, when done reasoning.',
  input_schema: {
    type: 'object',
    properties: {
      primary: {
        type: 'object',
        properties: {
          destinationId: { type: 'string' },
          rationale: { type: 'string', description: 'One sentence tying the pick to the traveler.' },
        },
        required: ['destinationId', 'rationale'],
      },
      alternates: {
        type: 'array',
        minItems: 2,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            destinationId: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['destinationId', 'rationale'],
        },
      },
    },
    required: ['primary', 'alternates'],
  },
};

export const searchStaysTool = {
  name: 'search_stays',
  description: 'Search lodging for the chosen destination. Optionally cap the nightly rate (USD).',
  input_schema: {
    type: 'object',
    properties: {
      priceCeilingUsd: { type: 'number', description: 'Optional max nightly rate in USD.' },
    },
    required: [],
  },
};

export const searchActivitiesTool = {
  name: 'search_activities',
  description: 'List points of interest and activities for the chosen destination.',
  input_schema: { type: 'object', properties: {}, required: [] },
};

export const searchFlightsTool = {
  name: 'search_flights',
  description: 'Search flight offers for the trip. Returns illustrative sandbox pricing.',
  input_schema: { type: 'object', properties: {}, required: [] },
};

export const submitItineraryTool = {
  name: 'submit_itinerary',
  description: 'Submit the final day-by-day itinerary. Call this once, when done.',
  input_schema: {
    type: 'object',
    properties: {
      stayId: { type: 'string', description: 'An id returned by search_stays.' },
      summary: { type: 'string', description: 'One-paragraph "why this trip".' },
      days: {
        type: 'array',
        description: 'One entry per night.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            activityIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Activity ids from search_activities for this day (2-4).',
            },
          },
          required: ['title', 'activityIds'],
        },
      },
    },
    required: ['stayId', 'summary', 'days'],
  },
};

export const SELECTION_TOOLS = [getClimateTool, submitDestinationsTool];
export const ITINERARY_TOOLS = [
  searchStaysTool,
  searchActivitiesTool,
  searchFlightsTool,
  submitItineraryTool,
];
