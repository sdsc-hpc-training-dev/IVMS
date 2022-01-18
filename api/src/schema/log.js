const mg = require('mongoose');

/** @type {mg.Schema<LogEntry>} */
const LogSchema = new mg.Schema(
    {
        data: { type: String },
        level: { type: Number },
        timestamp: { type: Date },
    },
    {
        versionKey: false,
    },
);

LogSchema.index({ level: 1 }, { unique: false });
LogSchema.index({ timestamp: 1 }, { unique: false });

const LogModel = mg.model('log', LogSchema);

module.exports = class LogCollection {
    /**
     *
     * @param {string} data
     * @param {number} level
     * @param {Date} timestamp
     */
    static add(data, level, timestamp = new Date()) {
        LogModel.create({ data, level, timestamp }).catch(_ => {});
    }

    /**
     * Get a range of logs
     * @param {number} level
     * @param {Date} from
     * @param {Date} to
     */
    static getRange(level, from, to) {
        return LogModel.find(
            {
                timestamp: {
                    $gte: from,
                    $lte: to,
                },
                level: {
                    $gte: level,
                },
            },
            {
                _id: 0,
            },
        )
            .lean()
            .exec();
    }

    // Test only
    static getAll() {
        return LogModel.find(
            {},
            {
                _id: 0,
            },
        )
            .lean()
            .exec();
    }

    // Test only
    static clear() {
        return LogModel.deleteMany({}).exec();
    }

    static searchText() {}
};
