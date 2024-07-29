import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, toNano, contractAddress } from '@ton/core';
import { compile } from '@ton/blueprint';
import BN from 'bn.js';
import '@ton/test-utils';

import { DexMinter } from '../wrappers/DexMinter';
import { JettonMinter } from '../wrappers/JettonMinter';
import { initAMM } from './utils/DexMinter';

const ALICE_INITIAL_BALANCE = toNano(3500);
const JETTON_LIQUIDITY = toNano(10);
const TON_LIQUIDITY = toNano(5);
const LP_DEFAULT_AMOUNT = 7071067;

const GAS_FEES = {
    ADD_LIQUIDITY: '0.2',
};

const alice = Address.parse('EQCLjyIQ9bF5t9h3oczEX3hPVK4tpW2Dqby0eHOH1y5_Nvb7');

describe('DexMinter Test ', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('DexMinter');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let dexMinter: SandboxContract<DexMinter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        dexMinter = blockchain.openContract(DexMinter.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await dexMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dexMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('add Liquidity - jetton wallet should be initialized', async () => {
        const masterUSDC = await JettonMinter.Create(new BN(0), alice, 'https://ipfs.io/ipfs/dasadas');
        masterUSDC.mint(deployer.address, alice, new BN(toNano(0.04).toString()));
    });
});
