function pitchYawInput(values, actor) {
    console.log("pitchYawInput", values, actor);
    actor.setControlKey('input_pitch', values[1])
    actor.setControlKey('input_yaw', values[0])
}



export {
    pitchYawInput
}