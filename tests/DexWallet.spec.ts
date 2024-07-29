import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { DexWallet } from '../wrappers/DexWallet';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('DexWallet', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('DexWallet');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let dexWallet: SandboxContract<DexWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        dexWallet = blockchain.openContract(DexWallet.createFromConfig({}, code));
        ``;
        deployer = await blockchain.treasury('deployer');

        const deployResult = await dexWallet.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dexWallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and dexWallet are ready to use
    });
});
