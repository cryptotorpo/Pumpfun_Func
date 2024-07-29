import { toNano } from '@ton/core';
import { PumpFun } from '../wrappers/PumpFun';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const pumpFun = provider.open(PumpFun.createFromConfig({}, await compile('PumpFun')));

    await pumpFun.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(pumpFun.address);

    // run methods on `pumpFun`
}
