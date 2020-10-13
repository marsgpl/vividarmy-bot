import { Player } from 'localTypes/Player';
import formatEstimate from './formatEstimate';
import formatGender from './formatGender';
import formatPower from './formatPower';

export default function(player: Player, indent: string = ''): string {
    const f = player.formatted;
    const hasAlliance = Boolean(f.allianceId);

    return indent + [
        hasAlliance ?
            `[${f.allianceTag}] ${player.name}` :
            player.name,
        `pos: __${f.posX},${f.posY}__`,
        `level: ${f.level}`,
        `power: ${f.power && formatPower(f.power)}`,
        `server: ${player.serverId}`,
        hasAlliance ?
            `alliance: [${f.allianceTag}] ${f.allianceName} #${f.allianceId}` :
            `alliance: no`,
        `gender: ${formatGender(f.gender || 0)}`,
        `locale: ${f.locale}`,
        `avatar: ${f.avatar?.match(/^http/i) ? `<${f.avatar}>` : f.avatar}`,
        `ban: ${formatEstimate(f.banSecondsLeft) || 'no'}`,
        `shield: ${formatEstimate(f.shieldSecondsLeft) || 'no'}`,
        `burn: ${formatEstimate(f.burnSecondsLeft) || 'no'}`,
        `id: ${player.playerId}`,
    ].join(`\n${indent}`);
}
