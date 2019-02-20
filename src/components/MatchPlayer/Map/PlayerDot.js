import React from 'react'
import { clamp } from 'lodash'
import { Arc, Circle, Group, Text, Label, Tag, Line, Image } from 'react-konva'
import { toScale } from '../../../lib/canvas-math.js'
import cpCar from '../../../assets/car.png'
import cpCarDamage from '../../../assets/carDamage.png'

const getBasePlayerColor = ({ colors }, marks, player) => {
    if (marks.focusedPlayer() === player.name) {
        return colors.dot.focused
    } else if (player.teammates.includes(marks.focusedPlayer())) {
        return colors.dot.teammate
    }

    return colors.dot.enemy
}

const getPlayerColor = ({ colors }, marks, player) => {
    const base = getBasePlayerColor({ colors }, marks, player)
    return `${base}E0`
}

const getBaseStatusColor = ({ colors }, marks, player) => {
    if (player.status === 'dead') {
        const isTeammate = player.teammates.includes(marks.focusedPlayer())
        const isFocused = marks.focusedPlayer() === player.name

        if (isTeammate || isFocused) {
            return colors.dot.deadTeammate
        }

        return colors.dot.dead
    }

    if (player.status !== 'dead' && player.health === 0) {
        return colors.dot.knocked
    }

    return colors.dot.base
}

const getStatusColor = ({ colors }, marks, player) => {
    const base = getBaseStatusColor({ colors }, marks, player)
    return `${base}B0`
}

const PlayerLabel = ({ visible, player, strokeColor }) => {
    if (!visible) return null

    return (
        <Label offsetY={-11}>
            <Tag
                fill="#000000A0"
                pointerDirection="up"
                pointerHeight={7}
                pointerWidth={11}
                stroke={strokeColor}
                strokeWidth={0.5}
                cornerRadius={4}
            />
            <Text
                fill={strokeColor}
                lineHeight={1}
                padding={5}
                text={player.name}
                fontSize={10}
                align="center"
            />
        </Label>
    )
}

const PlayerParachute = ({ visible, diameter, color }) => {
    if (!visible) return null

    return (
        <Group
            y={-diameter*2}
            scale={{x:0.75,y:0.75}}
        >
            <Arc
                fill={color}
                innerRadius={0}
                outerRadius={diameter}
                angle={180}
                rotation={180}
            />
            <Line
                points={[-diameter, 0, 0, diameter, 0, 0, 0, diameter, diameter, 0]}
                stroke={color}
                strokeWidth={1}
            />
        </Group>
    )
}

const PlayerDrive = ({ visible, diameter, image, damageImage, damagePercent }) => {
    if (!visible) return null

    const heightRatio = image && image.height / image.width || 1
    const baseWidth = diameter * 4
    const baseHeight = baseWidth * heightRatio
    const offsetX = diameter * 2
    const offsetY = diameter * 2

    let width = baseWidth
    let damageWidth = 0
    let crop
    let damageCrop
    if (damageImage && image) {
        width = damagePercent * baseWidth
        damageWidth = baseWidth - width
        const cropWidth = damagePercent * image.width
        const cropHeight = image.height
        crop = {
            x: 0,
            y: 0,
            width: cropWidth,
            height: cropHeight,
        }
        damageCrop = {
            x: cropWidth,
            y: 0,
            width: image.width - cropWidth,
            height: cropHeight,
        }
    }
    return (
        <Group
            scale={{x:1,y:1}}
            offsetY={diameter*2}
        >
            <Image
                visible={width>0}
                image={image}
                offsetX={offsetX}
                offsetY={offsetY}
                width={width}
                height={baseHeight}
                crop={crop}
            />
            <Image
                visible={damageWidth>0}
                image={damageImage}
                offsetX={offsetX-width}
                offsetY={offsetY}
                width={damageWidth}
                height={baseHeight}
                crop={damageCrop}
            />
        </Group>
    )
}

class PlayerDot extends React.Component {
    state = { carImage: null, carDamageImage: null }

    componentDidMount() {
        const carImage = new window.Image()
        carImage.src = cpCar
        carImage.onload = () => {
            this.setState({ carImage })
        }

        const carDamageImage = new window.Image()
        carDamageImage.src = cpCarDamage
        carDamageImage.onload = () => {
            this.setState({ carDamageImage })
        }
    }

    render() {
        const { options, player, pubgMapSize, mapSize, marks, mapScale, showName } = this.props
        const diameter = marks.isPlayerHovered(player.name) ? 11 : 8
        const scaledDiameter = diameter * clamp(mapScale / 1.4, 1, 1.3)
        const health = player.health / 100
        const mouseEvents = {
            onMouseOver(e) {
                marks.setHoveredPlayer(player.name)
            },

            onMouseOut() {
                marks.setHoveredPlayer(null)
            },

            onClick(e) {
                const toToggle = [player.name]

                if (e.evt.shiftKey) {
                    toToggle.push(...player.teammates)
                }

                if (marks.isPlayerTracked(player.name)) {
                    marks.setHoveredPlayer(null)
                }

                marks.toggleTrackedPlayer(...toToggle)
            },
        }
        return (
        <Group
            x={toScale(pubgMapSize, mapSize, player.location.x)}
            y={toScale(pubgMapSize, mapSize, player.location.y)}
            scale={{ x: 1 / mapScale, y: 1 / mapScale }}
        >
            <Group {...mouseEvents}>
                <Circle
                    fill={getStatusColor(options, marks, player)}
                    radius={(scaledDiameter / 2) + 0}
                    stroke="#000000"
                    strokeWidth={0.75}
                />
                <Arc
                    fill={getPlayerColor(options, marks, player)}
                    innerRadius={0}
                    outerRadius={scaledDiameter / 2}
                    angle={(360 * health)}
                />
            </Group>
            <PlayerDrive
                visible={player.vehicle&&!['Parachute','DummyTransportAircraft_C'].includes(player.vehicle)}
                diameter={scaledDiameter / 2}
                image={this.state.carImage}
                damageImage={this.state.carDamageImage}
                damagePercent={player.vehicleDamage}
            />
            <PlayerParachute
                visible={player.vehicle==='Parachute'}
                diameter={scaledDiameter / 2}
                color={options.colors.dot.parachute}
            />
            <PlayerLabel
                player={player}
                visible={showName || marks.isPlayerHovered(player.name)}
                strokeColor={getPlayerColor(options, marks, player)}
            />
        </Group>
        )
    }
}

export default PlayerDot
