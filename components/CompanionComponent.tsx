'use client'

import { cn, configureAssistant, getSubjectColor } from "@/lib/utils"
import { vapi } from "@/lib/vapi.sdk"
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import soundwaves from '@/constants/soundwaves.json'

enum CallStatus {
	INACTIVE = 'INACTIVE',
	CONNECTING = 'CONNECTING',
	ACTIVE = 'ACTIVE',
	FINISHED = 'FINISHED'
}

const CompanionComponent = ({ subject, topic, name, userName, userImage, voice, style, companionId }: CompanionComponentProps) => {

	const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isMuted, setIsMuted] = useState(false)
	const [messages, setMessages] = useState<SavedMessage[]>([])

	const lottieRef = useRef<LottieRefCurrentProps>(null)

	useEffect(() => {
		if (lottieRef) {
			if (isSpeaking) {
				lottieRef.current?.play()
			} else {
				lottieRef.current?.stop()
			}
		}
	}, [isSpeaking, lottieRef])

	useEffect(() => {
		const onCallStart = () => setCallStatus(CallStatus.ACTIVE)

		const onCallEnd = () => setCallStatus(CallStatus.FINISHED)

		const onMessage = (message: Message) => {
			if (message.type === 'transcript' && message.transcriptType === 'final') {
				const newMessage = { role: message.role, content: message.transcript }
				setMessages((prev) => [newMessage, ...prev])
			}
		}

		const onSpeechStart = () => setIsSpeaking(true)

		const onSpeechEnd = () => setIsSpeaking(false)

		const onError = (error: Error) => console.log('Error: ', error)

		vapi.on('call-start', onCallStart)
		vapi.on('call-end', onCallEnd)
		vapi.on('message', onMessage)
		vapi.on('error', onError)
		vapi.on('speech-start', onSpeechStart)
		vapi.on('speech-end', onSpeechEnd)

		return () => {
			vapi.off('call-start', onCallStart)
			vapi.off('call-end', onCallEnd)
			vapi.off('message', onMessage)
			vapi.off('error', onError)
			vapi.off('speech-start', onSpeechStart)
			vapi.off('speech-end', onSpeechEnd)
		}
	}, [])

	const toggleMicrophone = () => {
		const isMuted = vapi.isMuted();
		vapi.setMuted(!isMuted);
		setIsMuted(!isMuted);
	}

	const handleCall = async () => {
		setCallStatus(CallStatus.CONNECTING)

		try {
			const assistantOverrides = {
				variableValues: { subject, topic, style },
				clientMessages: ["transcript"],
				serverMessages: [],
			}

			// @ts-expect-error error
			vapi.start(configureAssistant(voice, style), assistantOverrides)
		} catch (error) {
			console.log('Error in hanldeCall: ', error)
		} finally {
			setCallStatus(CallStatus.INACTIVE)
		}
	}

	const handleDisconnect = async () => {
		setCallStatus(CallStatus.FINISHED)
		vapi.stop()
	}


	return (
		<section className="flex flex-col h-[]70vh">
			<section className="flex gap-8 max-sm:flex-col">
				<div className="companion-section">
					<div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
						<div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse')}>
							<Image src={`/icons/${subject}.svg`} width={150} height={150} alt={`${subject} icon`} className="max-sm:w-fit" />
						</div>
						<div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
							<Lottie
								lottieRef={lottieRef}
								animationData={soundwaves}
								autoPlay={false}
								className="companion-lottie"
							/>
						</div>
					</div>
					<p className="font-bold text-2xl">{name}</p>
				</div>
				<div className="user-section">
					<div className="user-avatar">
						<Image src={userImage} width={130} height={130} alt={userName} className="rounded-lg" />
						<p className="font-bold text-2xl">{userName}</p>
					</div>
					<button className="btn-mic" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
						<Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} width={36} height={20} alt={isMuted ? 'mic-off' : 'mic'} />
						<p className="max-sm:hidden">
							{isMuted ? 'Turn on microphone' : 'Turn off microphone'}
						</p>
					</button>
					<button className={cn('rounded-lg px-2 py-1 cursor-pointer transition-colors w-full text-white', callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', callStatus === CallStatus.CONNECTING && 'animate-pulse')} onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}>
						{
							callStatus === CallStatus.ACTIVE
								? 'End Session'
								: callStatus === CallStatus.CONNECTING
									? 'Connecting...'
									: 'Start Session'
						}
					</button>
				</div>
			</section>
			<section className="transcript">
				<div className="transcipt-message no-scrollbar">
					{
						messages.map((message,index) => {
							if (message.role === 'assistant') {
								return (
									<p key={index} className="max-sm:text-sm">{name.split(' ')[0].replace('/[.,]/g', '')}: {message.content}</p>
								)
							}else {
								return <p key={index} className="max-sm:text-sm text-primary">{userName}: {message.content}</p>
							}
						})
					}
				</div>
				<div className="transcript-fade" />
			</section>
		</section>
	)
}

export default CompanionComponent