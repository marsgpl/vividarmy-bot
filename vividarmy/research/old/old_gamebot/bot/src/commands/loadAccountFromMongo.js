const log = require('modules/log').setName('loadAccountFromMongo');

module.exports = async function(ctx, { accountId }) {
    log('start');

    const { conf, db } = ctx;

    const accounts = await db.collection(conf.mongo.accountsCollection);

    const accountData = await accounts.findOne({ _id: accountId });

    const account = {
        id: accountId,
        data: accountData || { _id: accountId },
    };

    account.save = async () => {
        const r = await accounts.updateOne({
            _id: account.id,
        }, {
            $set: account.data,
        }, {
            upsert: true,
        });

        if (!r.result.ok) {
            throw Error(`account id:${accountId} save failed`);
        }
    };

    log(accountId);

    return account;
};
