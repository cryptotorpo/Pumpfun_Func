import { toNano } from '@ton/core';
import { DexMinter } from '../wrappers/DexMinter';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dexMinter = provider.open(DexMinter.createFromConfig({}, await compile('DexMinter')));

    await dexMinter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dexMinter.address);

    // run methods on `dexMinter`
}
