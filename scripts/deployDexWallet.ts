import { toNano } from '@ton/core';
import { DexWallet } from '../wrappers/DexWallet';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dexWallet = provider.open(DexWallet.createFromConfig({}, await compile('DexWallet')));

    await dexWallet.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dexWallet.address);

    // run methods on `dexWallet`
}
