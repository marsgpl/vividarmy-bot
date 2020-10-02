import formatPower from 'gameCommands/formatPower';
import formatGender from 'gameCommands/formatGender';

export default function(
    playerInfoResponse: {[key: string]: any},
    playerPosInfoResponse?: {[key: string]: any},
): {[key: string]: any} {
    const point = playerPosInfoResponse?.point || {};
    const pointPlayer = point.p || {};
    const playerInfo = JSON.parse(playerInfoResponse.playerInfo || pointPlayer.playerInfo) || {};

    const uid = String(playerInfoResponse.uid || '') || String(Number(pointPlayer.pid) || ''); // 307176813145
    const allianceId = Number(playerInfoResponse.allianceId); // 100067575
    const allianceName = String(playerInfoResponse.allianceName || ''); // CobraKaiDojo
    const allianceTag = String(playerInfoResponse.allianceTag || '') || String(pointPlayer.a_tag || ''); // CKD
    const banEndTime = Number(playerInfoResponse.banEndTime); // 0
    const level = Number(playerInfoResponse.level) || Number(pointPlayer.level); // 74
    const worldId = Number(playerInfoResponse.worldId); // 27
    const showCareerId = Number(playerInfoResponse.showCareerId); // 1002702
    const power = Number(playerInfoResponse.power) || Number(pointPlayer.power); // 1.795250197479538e+27

    const flagId = Number(playerInfo.nationalflag); // 167
    const gender = Number(playerInfo.gender) || Number(playerInfo.usergender); // 0 - not specified, 1 - male, 2 - female
    const avatar = String(playerInfo.headimgurl_custom || '') || String(playerInfo.headimgurl || '') || String(playerInfo.avatarurl || ''); // idstring or url
    const name = String(playerInfo.username || '') || String(playerInfo.nickname || ''); // Swenor

    const x = Number(point.x); // 354
    const y = Number(point.y); // 450
    const serverId = Number(point.k) || Number(pointPlayer.w); // 601
    const locationId = point.id; // 115378
    const locationType = point.pointType; // 1

    const plateId = Number(pointPlayer.plateId); // 1
    const sBNum = Number(pointPlayer.sBNum); // 0
    const shieldTime = Number(pointPlayer.shieldTime); // 1601244890
    const fireTime = Number(pointPlayer.fireTime); // 0
    const castleEffectId = Number(pointPlayer.castleEffectId); // 7
    const skinId = Number(pointPlayer.skinId); // 1710700
    const language = String(pointPlayer.language || ''); // 'en'
    const sml = Number(pointPlayer.sml); // 0
    const province = Number(pointPlayer.province); // 27
    const sskin = Number(pointPlayer.sskin); // 0
    const fireState = Number(pointPlayer.fireState); // 0
    const aid = Number(pointPlayer.aid); // 100067575
    const countryRank = Number(pointPlayer.countryRank); // 0
    const sBId = Number(pointPlayer.sBId); // 0

    const now = Math.floor(Date.now() / 1000);

    const powerFormatted = formatPower(power);
    const genderFormatted = formatGender(gender);
    const positionFormatted = x && y ? `${x},${y}` : 'removed from map';
    const fullNameFormatted = allianceTag ? `[${allianceTag}] ${name}` : name;
    const allianceFormatted = allianceId ? `${allianceName} [${allianceTag}] id=${allianceId}` : 'none';
    const avatarFormatted = avatar && avatar.indexOf('http') === 0 ? `<${avatar}>` : avatar;
    const banFormatted = !banEndTime || banEndTime < now ? 'no' : `BANNED UNTIL ${new Date(banEndTime * 1000)}`;
    const shieldFormatted = !shieldTime || shieldTime < now ? 'no' : `SHIELD UNTIL ${new Date(shieldTime * 1000)}`;
    const fireFormatted = !fireTime || fireTime < now ? 'no' : `BURNING UNTIL ${new Date(fireTime * 1000)}`;
    const serverFormatted = serverId || 'removed';

    const formatted: string[] = [
        fullNameFormatted,
        `level: ${level}`,
        `power: ${powerFormatted}`,
        `position: ${positionFormatted}`,
        `alliance: ${allianceFormatted}`,
        `server: ${serverFormatted}`,
        `gender: ${genderFormatted}`,
        `language: ${language}`,
        `profile pic: ${avatarFormatted}`,
        `ban: ${banFormatted}`,
        `shield: ${shieldFormatted}`,
        `burning: ${fireFormatted}`,
        `id: ${uid}`,
    ];

    return {
        uid,
        allianceId,
        allianceName,
        allianceTag,
        banEndTime,
        level,
        worldId,
        showCareerId,
        power,

        flagId,
        gender,
        avatar,
        name,

        x,
        y,
        serverId,
        locationId,
        locationType,

        plateId,
        sBNum,
        shieldTime,
        fireTime,
        castleEffectId,
        skinId,
        language,
        sml,
        province,
        sskin,
        fireState,
        aid,
        countryRank,
        sBId,

        formatted,
    };
}
